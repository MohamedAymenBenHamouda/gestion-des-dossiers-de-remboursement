import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class StorageService {
  final FlutterSecureStorage _secure = const FlutterSecureStorage();

  Future<void> setToken(String token) async {
    await _secure.write(key: AppConfig.storageTokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _secure.read(key: AppConfig.storageTokenKey);
  }

  Future<void> clearToken() async {
    await _secure.delete(key: AppConfig.storageTokenKey);
  }

  // SharedPreferences helpers
  Future<void> setStringPref(String key, String value) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(key, value);
  }

  Future<String?> getStringPref(String key) async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString(key);
  }

  Future<void> clearPref(String key) async {
    final sp = await SharedPreferences.getInstance();
    await sp.remove(key);
  }
}
