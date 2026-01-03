import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class CacheService {
  static const String _cachePrefix = 'cache_';
  static const String _timestampSuffix = '_timestamp';
  static const String _etagSuffix = '_etag';

  // Default cache duration: 5 minutes
  static const Duration defaultCacheDuration = Duration(minutes: 5);

  final SharedPreferences _prefs;

  CacheService(this._prefs);

  /// Get cached data if valid, returns null if expired or not found
  T? get<T>(String key, {Duration? maxAge}) {
    final cacheKey = '$_cachePrefix$key';
    final timestampKey = '$cacheKey$_timestampSuffix';

    final cachedData = _prefs.getString(cacheKey);
    final timestamp = _prefs.getInt(timestampKey);

    if (cachedData == null || timestamp == null) {
      return null;
    }

    final cachedTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
    final age = DateTime.now().difference(cachedTime);
    final effectiveMaxAge = maxAge ?? defaultCacheDuration;

    if (age > effectiveMaxAge) {
      // Cache expired
      return null;
    }

    try {
      final decoded = jsonDecode(cachedData);
      return decoded as T;
    } catch (_) {
      return null;
    }
  }

  /// Save data to cache with timestamp
  Future<void> set(String key, dynamic data, {String? etag}) async {
    final cacheKey = '$_cachePrefix$key';
    final timestampKey = '$cacheKey$_timestampSuffix';
    final etagKey = '$cacheKey$_etagSuffix';

    await _prefs.setString(cacheKey, jsonEncode(data));
    await _prefs.setInt(timestampKey, DateTime.now().millisecondsSinceEpoch);

    if (etag != null) {
      await _prefs.setString(etagKey, etag);
    }
  }

  /// Get stored ETag for a key
  String? getEtag(String key) {
    final etagKey = '$_cachePrefix$key$_etagSuffix';
    return _prefs.getString(etagKey);
  }

  /// Check if cache has valid data (not expired)
  bool hasValidCache(String key, {Duration? maxAge}) {
    return get<dynamic>(key, maxAge: maxAge) != null;
  }

  /// Get cache timestamp
  DateTime? getCacheTime(String key) {
    final timestampKey = '$_cachePrefix$key$_timestampSuffix';
    final timestamp = _prefs.getInt(timestampKey);
    if (timestamp == null) return null;
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }

  /// Invalidate specific cache
  Future<void> invalidate(String key) async {
    final cacheKey = '$_cachePrefix$key';
    await _prefs.remove(cacheKey);
    await _prefs.remove('$cacheKey$_timestampSuffix');
    await _prefs.remove('$cacheKey$_etagSuffix');
  }

  /// Invalidate all caches matching a prefix
  Future<void> invalidateByPrefix(String prefix) async {
    final fullPrefix = '$_cachePrefix$prefix';
    final keys = _prefs.getKeys().where((k) => k.startsWith(fullPrefix));
    for (final key in keys) {
      await _prefs.remove(key);
    }
  }

  /// Clear all caches
  Future<void> clearAll() async {
    final keys = _prefs.getKeys().where((k) => k.startsWith(_cachePrefix));
    for (final key in keys) {
      await _prefs.remove(key);
    }
  }
}

/// Cache keys for different data types
class CacheKeys {
  static const String programs = 'programs';
  static const String programDetail = 'program_'; // + id
  static const String recommendations = 'recommendations';
  static const String applications = 'applications';
  static const String applicationDetail = 'application_'; // + id
  static const String userProfile = 'user_profile';
  static const String programStats = 'program_stats';

  static String forProgram(String id) => '$programDetail$id';
  static String forApplication(String id) => '$applicationDetail$id';
}
