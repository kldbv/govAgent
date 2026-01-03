import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../utils/constants.dart';

class StorageService {
  late final FlutterSecureStorage _secureStorage;
  late final SharedPreferences _prefs;
  bool _initialized = false;

  StorageService() {
    _secureStorage = const FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock_this_device,
      ),
    );
  }

  Future<void> init() async {
    if (_initialized) return;
    _prefs = await SharedPreferences.getInstance();
    _initialized = true;
  }

  void _checkInitialized() {
    if (!_initialized) {
      throw StateError('StorageService not initialized. Call init() first.');
    }
  }

  // Secure Storage - for tokens and sensitive data

  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    await _secureStorage.write(
      key: AppConstants.accessTokenKey,
      value: accessToken,
    );
    if (refreshToken != null) {
      await _secureStorage.write(
        key: AppConstants.refreshTokenKey,
        value: refreshToken,
      );
    }
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: AppConstants.accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConstants.refreshTokenKey);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: AppConstants.accessTokenKey);
    await _secureStorage.delete(key: AppConstants.refreshTokenKey);
  }

  Future<bool> hasValidToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // User data

  Future<void> saveUser(User user) async {
    _checkInitialized();
    await _prefs.setString(AppConstants.userKey, jsonEncode(user.toJson()));
  }

  User? getUser() {
    _checkInitialized();
    final userJson = _prefs.getString(AppConstants.userKey);
    if (userJson == null) return null;
    try {
      return User.fromJson(jsonDecode(userJson) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> clearUser() async {
    _checkInitialized();
    await _prefs.remove(AppConstants.userKey);
  }

  // App Settings

  Future<void> setLanguage(String languageCode) async {
    _checkInitialized();
    await _prefs.setString(AppConstants.languageKey, languageCode);
  }

  String getLanguage() {
    _checkInitialized();
    return _prefs.getString(AppConstants.languageKey) ??
        AppConstants.defaultLanguage;
  }

  Future<void> setThemeMode(String mode) async {
    _checkInitialized();
    await _prefs.setString(AppConstants.themeKey, mode);
  }

  String getThemeMode() {
    _checkInitialized();
    return _prefs.getString(AppConstants.themeKey) ?? 'system';
  }

  Future<void> setOnboardingComplete(bool complete) async {
    _checkInitialized();
    await _prefs.setBool(AppConstants.onboardingCompleteKey, complete);
  }

  bool isOnboardingComplete() {
    _checkInitialized();
    return _prefs.getBool(AppConstants.onboardingCompleteKey) ?? false;
  }

  // Generic storage methods

  Future<void> setString(String key, String value) async {
    _checkInitialized();
    await _prefs.setString(key, value);
  }

  String? getString(String key) {
    _checkInitialized();
    return _prefs.getString(key);
  }

  Future<void> setBool(String key, bool value) async {
    _checkInitialized();
    await _prefs.setBool(key, value);
  }

  bool? getBool(String key) {
    _checkInitialized();
    return _prefs.getBool(key);
  }

  Future<void> setInt(String key, int value) async {
    _checkInitialized();
    await _prefs.setInt(key, value);
  }

  int? getInt(String key) {
    _checkInitialized();
    return _prefs.getInt(key);
  }

  Future<void> remove(String key) async {
    _checkInitialized();
    await _prefs.remove(key);
  }

  // Clear all data

  Future<void> clearAll() async {
    await clearTokens();
    await clearUser();
    _checkInitialized();
    // Keep language and theme settings
    final language = getLanguage();
    final theme = getThemeMode();
    final onboarding = isOnboardingComplete();
    await _prefs.clear();
    await setLanguage(language);
    await setThemeMode(theme);
    await setOnboardingComplete(onboarding);
  }
}
