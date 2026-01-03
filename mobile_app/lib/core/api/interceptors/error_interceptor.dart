import 'package:dio/dio.dart';
import '../api_exception.dart';

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Debug: print error details
    print('ErrorInterceptor: ${err.type}, statusCode: ${err.response?.statusCode}');
    print('ErrorInterceptor data: ${err.response?.data}');

    final apiException = _handleError(err);
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        error: apiException,
        type: err.type,
        response: err.response,
      ),
    );
  }

  ApiException _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException.timeout();

      case DioExceptionType.connectionError:
        return ApiException.network();

      case DioExceptionType.badResponse:
        return _handleBadResponse(error.response);

      case DioExceptionType.cancel:
        return const ApiException(
          message: 'Запрос отменён',
          type: ApiExceptionType.unknown,
        );

      default:
        return const ApiException(
          message: 'Произошла неизвестная ошибка',
          type: ApiExceptionType.unknown,
        );
    }
  }

  ApiException _handleBadResponse(Response? response) {
    final statusCode = response?.statusCode;
    final data = response?.data;

    String? message;
    if (data is Map<String, dynamic>) {
      // Backend format: { success: false, error: { message: "..." } }
      final errValue = data['error'];
      final msgValue = data['message'];
      final errsValue = data['errors'];

      if (errValue is Map<String, dynamic>) {
        message = errValue['message']?.toString();
      } else if (errValue is String) {
        message = errValue;
      } else if (msgValue is String) {
        message = msgValue;
      } else if (errsValue is List && errsValue.isNotEmpty) {
        message = errsValue.first.toString();
      }
    }

    switch (statusCode) {
      case 400:
        return ApiException(
          message: message ?? 'Неверный запрос',
          statusCode: 400,
          data: data,
          type: ApiExceptionType.validation,
        );

      case 401:
        return ApiException.unauthorized(message);

      case 403:
        return ApiException.forbidden(message);

      case 404:
        return ApiException.notFound(message);

      case 422:
        return ApiException.validation(
          message ?? 'Ошибка валидации',
          data,
        );

      case 429:
        return const ApiException(
          message: 'Слишком много запросов. Подождите немного.',
          statusCode: 429,
          type: ApiExceptionType.unknown,
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return ApiException.server(message);

      default:
        return ApiException(
          message: message ?? 'Произошла ошибка',
          statusCode: statusCode,
          data: data,
          type: ApiExceptionType.unknown,
        );
    }
  }
}
