class AppConstants {
  AppConstants._();

  // API
  // Production: https://business-support-platform.vercel.app
  // Local: http://localhost:3001 (or http://10.0.2.2:3001 for Android emulator)
  static const String baseUrl = 'http://localhost:3001';
  static const String apiVersion = '/api';

  // Timeouts
  static const int connectionTimeout = 30000;
  static const int receiveTimeout = 30000;

  // Pagination
  static const int defaultPageSize = 20;

  // Cache
  static const int cacheMaxAge = 3600; // 1 hour in seconds

  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 50;
  static const int binLength = 12;
  static const int iinLength = 12;

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user_data';
  static const String languageKey = 'language';
  static const String themeKey = 'theme_mode';
  static const String onboardingCompleteKey = 'onboarding_complete';

  // Supported Languages
  static const String languageKazakh = 'kk';
  static const String languageRussian = 'ru';
  static const String defaultLanguage = languageRussian;
}

class AppRoutes {
  AppRoutes._();

  static const String splash = '/';
  static const String onboarding = '/onboarding';
  static const String completeProfile = '/complete-profile';
  static const String login = '/login';
  static const String register = '/register';
  static const String forgotPassword = '/forgot-password';
  static const String home = '/home';
  static const String programs = '/programs';
  static const String programDetail = '/programs/:id';
  static const String calculator = '/calculator';
  static const String applications = '/applications';
  static const String applicationDetail = '/applications/:id';
  static const String applicationForm = '/applications/new/:programId';
  static const String applicationDraft = '/applications/draft/:draftId';
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String notifications = '/notifications';
  static const String settings = '/settings';
}
