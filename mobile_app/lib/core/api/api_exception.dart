class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;
  final ApiExceptionType type;

  const ApiException({
    required this.message,
    this.statusCode,
    this.data,
    this.type = ApiExceptionType.unknown,
  });

  factory ApiException.network([String? message]) {
    return ApiException(
      message: message ?? 'Ошибка сети. Проверьте подключение к интернету.',
      type: ApiExceptionType.network,
    );
  }

  factory ApiException.timeout([String? message]) {
    return ApiException(
      message: message ?? 'Время ожидания истекло. Попробуйте позже.',
      type: ApiExceptionType.timeout,
    );
  }

  factory ApiException.unauthorized([String? message]) {
    return ApiException(
      message: message ?? 'Сессия истекла. Войдите снова.',
      statusCode: 401,
      type: ApiExceptionType.unauthorized,
    );
  }

  factory ApiException.forbidden([String? message]) {
    return ApiException(
      message: message ?? 'Доступ запрещён.',
      statusCode: 403,
      type: ApiExceptionType.forbidden,
    );
  }

  factory ApiException.notFound([String? message]) {
    return ApiException(
      message: message ?? 'Ресурс не найден.',
      statusCode: 404,
      type: ApiExceptionType.notFound,
    );
  }

  factory ApiException.validation(String message, [dynamic data]) {
    return ApiException(
      message: message,
      statusCode: 422,
      data: data,
      type: ApiExceptionType.validation,
    );
  }

  factory ApiException.server([String? message]) {
    return ApiException(
      message: message ?? 'Ошибка сервера. Попробуйте позже.',
      statusCode: 500,
      type: ApiExceptionType.server,
    );
  }

  bool get isNetworkError =>
      type == ApiExceptionType.network || type == ApiExceptionType.timeout;

  bool get isAuthError =>
      type == ApiExceptionType.unauthorized ||
      type == ApiExceptionType.forbidden;

  @override
  String toString() => message;
}

enum ApiExceptionType {
  network,
  timeout,
  unauthorized,
  forbidden,
  notFound,
  validation,
  server,
  unknown,
}
