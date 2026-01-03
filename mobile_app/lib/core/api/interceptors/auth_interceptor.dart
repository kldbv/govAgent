import 'package:dio/dio.dart';
import '../../services/storage_service.dart';

class AuthInterceptor extends Interceptor {
  final StorageService _storageService;
  final void Function()? onUnauthorized;

  AuthInterceptor({
    required StorageService storageService,
    this.onUnauthorized,
  }) : _storageService = storageService;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Skip auth for login/register endpoints
    final skipAuth = ['/auth/login', '/auth/register', '/auth/refresh'];
    final shouldSkip = skipAuth.any((path) => options.path.contains(path));

    if (!shouldSkip) {
      final token = await _storageService.getAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    print('AuthInterceptor onError: statusCode=${err.response?.statusCode}, path=${err.requestOptions.path}');

    if (err.response?.statusCode == 401) {
      // Skip refresh for login/register - these are expected 401s
      final isAuthEndpoint = err.requestOptions.path.contains('/auth/login') ||
          err.requestOptions.path.contains('/auth/register');

      if (isAuthEndpoint) {
        // Just pass through - invalid credentials
        return handler.next(err);
      }

      // Try to refresh token for other endpoints
      final refreshToken = await _storageService.getRefreshToken();
      if (refreshToken != null) {
        try {
          // Attempt token refresh
          final dio = Dio();
          final response = await dio.post(
            '${err.requestOptions.baseUrl}/auth/refresh',
            data: {'refreshToken': refreshToken},
          );

          if (response.statusCode == 200) {
            final data = response.data['data'] as Map<String, dynamic>?;
            final newAccessToken = data?['token'] ?? response.data['accessToken'];
            final newRefreshToken = data?['refreshToken'] ?? response.data['refreshToken'];

            await _storageService.saveTokens(
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            );

            // Retry original request with new token
            err.requestOptions.headers['Authorization'] =
                'Bearer $newAccessToken';
            final retryResponse = await dio.fetch(err.requestOptions);
            return handler.resolve(retryResponse);
          }
        } catch (e) {
          print('AuthInterceptor: refresh failed: $e');
          // Refresh failed, logout
          await _storageService.clearAll();
          onUnauthorized?.call();
        }
      } else {
        // No refresh token, logout
        await _storageService.clearAll();
        onUnauthorized?.call();
      }
    }

    handler.next(err);
  }
}
