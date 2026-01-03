import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../api/api_exception.dart';
import '../models/user.dart';
import 'storage_service.dart';

class AuthService {
  final ApiClient _apiClient;
  final StorageService _storageService;

  AuthService({
    required ApiClient apiClient,
    required StorageService storageService,
  })  : _apiClient = apiClient,
        _storageService = storageService;

  Future<User> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      print('AuthService login response: $response');

      // Backend returns: { success, message, data: { user, token } }
      final data = response['data'] as Map<String, dynamic>;
      final accessToken = data['token'] as String;
      final userData = data['user'] as Map<String, dynamic>;

      print('AuthService userData: $userData');

      await _storageService.saveTokens(
        accessToken: accessToken,
        refreshToken: null,
      );

      final user = User.fromJson(userData);
      print('AuthService user created: ${user.email}');
      await _storageService.saveUser(user);

      return user;
    } on ApiException {
      rethrow;
    } catch (e, stackTrace) {
      print('AuthService login error: $e');
      print('Stack trace: $stackTrace');
      throw ApiException(
        message: 'Ошибка при входе: $e',
        type: ApiExceptionType.unknown,
      );
    }
  }

  Future<User> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        ApiEndpoints.register,
        data: {
          'email': email,
          'password': password,
          'full_name': fullName,
        },
      );

      // Backend returns: { success, message, data: { user, token } }
      final data = response['data'] as Map<String, dynamic>;
      final accessToken = data['token'] as String;
      final userData = data['user'] as Map<String, dynamic>;

      await _storageService.saveTokens(
        accessToken: accessToken,
        refreshToken: null,
      );

      final user = User.fromJson(userData);
      await _storageService.saveUser(user);

      return user;
    } on ApiException {
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {
      // Ignore errors during logout
    } finally {
      await _storageService.clearAll();
    }
  }

  Future<User> getCurrentUser() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>(
        ApiEndpoints.me,
      );

      // Backend returns: { success, data: { user: {...} } }
      final data = response['data'] as Map<String, dynamic>;
      final userData = data['user'] as Map<String, dynamic>;

      final user = User.fromJson(userData);
      await _storageService.saveUser(user);

      return user;
    } on ApiException {
      rethrow;
    }
  }

  /// Update user profile with all required fields for backend API
  /// Required fields: business_type, business_size, industry, region, experience_years
  Future<User> updateProfile({
    // Required fields
    required String businessType,
    required String businessSize,
    required String industry,
    required String region,
    required int experienceYears,
    // Optional fields
    double? annualRevenue,
    int? employeeCount,
    String? bin,
    String? okedCode,
    double? desiredLoanAmount,
    List<String>? businessGoals,
    String? businessGoalsComments,
    // User info fields (stored in users table)
    String? companyName,
    String? phone,
  }) async {
    try {
      await _apiClient.put<Map<String, dynamic>>(
        ApiEndpoints.profile,
        data: {
          // Required fields
          'business_type': businessType,
          'business_size': businessSize,
          'industry': industry,
          'region': region,
          'experience_years': experienceYears,
          // Optional fields
          if (annualRevenue != null) 'annual_revenue': annualRevenue,
          if (employeeCount != null) 'employee_count': employeeCount,
          if (bin != null && bin.isNotEmpty) 'bin': bin,
          if (okedCode != null && okedCode.isNotEmpty) 'oked_code': okedCode,
          if (desiredLoanAmount != null) 'desired_loan_amount': desiredLoanAmount,
          if (businessGoals != null) 'business_goals': businessGoals,
          if (businessGoalsComments != null && businessGoalsComments.isNotEmpty)
            'business_goals_comments': businessGoalsComments,
          // User info fields
          if (companyName != null) 'company_name': companyName,
          if (phone != null) 'phone': phone,
        },
      );

      // Backend returns profile, but we need to fetch full user data
      // The profile response doesn't contain all user data, so refetch
      return await getCurrentUser();
    } on ApiException {
      rethrow;
    }
  }

  Future<void> forgotPassword(String email) async {
    try {
      await _apiClient.post(
        ApiEndpoints.forgotPassword,
        data: {'email': email},
      );
    } on ApiException {
      rethrow;
    }
  }

  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      await _apiClient.post(
        ApiEndpoints.resetPassword,
        data: {
          'token': token,
          'password': newPassword,
        },
      );
    } on ApiException {
      rethrow;
    }
  }

  User? getCachedUser() {
    return _storageService.getUser();
  }

  Future<bool> isLoggedIn() async {
    return await _storageService.hasValidToken();
  }
}
