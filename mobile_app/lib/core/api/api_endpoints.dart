class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String me = '/auth/me';
  static const String profile = '/auth/profile';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';

  // Programs
  static const String programs = '/programs';
  static String programDetail(String id) => '/programs/$id';
  static const String programRecommendations = '/programs/recommendations';
  static String programSearch(String query) => '/programs/search?q=$query';

  // Calculator
  static const String calculate = '/calculator/calculate';
  static String calculatorProgramData(String programId) =>
      '/calculator/program/$programId/data';

  // Applications
  static const String applications = '/applications';
  static String applicationDetail(String id) => '/applications/$id';
  static String applicationDraft(String programId) =>
      '/applications/program/$programId/draft';
  static String applicationSubmit(String id) => '/applications/$id/submit';
  static String applicationCancel(String id) => '/applications/$id/cancel';
  static String uploadDocument(String applicationId) =>
      '/applications/$applicationId/documents';

  // Reference data
  static const String regions = '/reference/regions';
  static const String okedCodes = '/reference/oked-codes';
  static const String businessTypes = '/reference/business-types';

  // Notifications
  static const String notifications = '/notifications';
  static String notificationRead(String id) => '/notifications/$id/read';
  static const String notificationReadAll = '/notifications/read-all';

  // Devices (for push notifications)
  static const String devices = '/devices';
  static String deviceUnregister(String token) => '/devices/$token';
}
