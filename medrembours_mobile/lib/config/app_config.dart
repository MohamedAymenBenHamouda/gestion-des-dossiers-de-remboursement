import 'package:flutter/foundation.dart';

class AppConfig {
  // Pour émulateur Android
  static const String baseUrlAndroid = 'http://10.0.2.2:8089/api';

  // Pour appareil réel (remplacez par votre IP locale)
  static const String baseUrlDevice = 'http://192.168.1.13:8089/api';

  // Pour web / desktop
  static const String baseUrlLocal = 'http://127.0.0.1:8089/api';

  // ── Sélection active ──
  static String get baseUrl {
  if (kIsWeb) return baseUrlLocal;
  
  // Si vous lancez sur un vrai téléphone, utilisez baseUrlDevice
  // Pour simplifier pendant vos tests, vous pouvez forcer baseUrlDevice ici :
  return baseUrlDevice; 
}
  // ── Clés de stockage ──
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String storageTokenKey = 'auth_token';
}
