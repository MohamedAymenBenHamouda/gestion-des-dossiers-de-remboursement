// lib/services/auth_service.dart

import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/user_model.dart';
import 'storage_service.dart';

/// Résultat de l'inscription : indique si une vérification par email est requise
class RegisterResult {
  final bool success;
  final bool verificationRequired;
  final String? email;
  final String? errorMessage;

  RegisterResult({
    required this.success,
    this.verificationRequired = false,
    this.email,
    this.errorMessage,
  });
}

class AuthService extends ChangeNotifier {
  final StorageService _storage = StorageService();
  UserModel? _currentUser;
  String? _token;
  bool _isAuthenticated = false;
  bool _mustChangePassword = false;

  UserModel? get currentUser => _currentUser;
  String? get token => _token;
  bool get isAuthenticated => _isAuthenticated;
  bool get mustChangePassword => _mustChangePassword;

  Future<bool> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        _token = data['accessToken'];
        _currentUser = UserModel.fromJson(Map<String, dynamic>.from(data['user']));
        _mustChangePassword = data['mustChangePassword'] == true;

        await _storage.setToken(_token!);
        await _storage.setStringPref(AppConfig.userKey, jsonEncode(data['user']));

        _isAuthenticated = true;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    }
  }

  /// Étape 1 : Inscription — retourne un RegisterResult.
  /// Si [verificationRequired] est true, naviguer vers l'écran de vérification OTP.
  Future<RegisterResult> register({
    required String nom,
    required String prenom,
    required String email,
    required String password,
    String? cin,
    String? telephone,
  }) async {
    try {
      final bodyMap = <String, String>{
        'nom': nom,
        'prenom': prenom,
        'email': email,
        'password': password,
      };
      if (cin != null && cin.isNotEmpty) bodyMap['cin'] = cin;
      if (telephone != null && telephone.isNotEmpty) bodyMap['telephone'] = telephone;

      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(bodyMap),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        final verificationRequired = data?['verificationRequired'] ?? false;
        return RegisterResult(
          success: true,
          verificationRequired: verificationRequired,
          email: email,
        );
      }

      // Récupérer le message d'erreur du backend si disponible
      String? errorMsg;
      try {
        final body = jsonDecode(response.body);
        errorMsg = body['message'] ?? body['error'];
      } catch (_) {}
      return RegisterResult(success: false, errorMessage: errorMsg);
    } catch (e) {
      debugPrint('Register error: $e');
      return RegisterResult(success: false, errorMessage: 'Erreur réseau.');
    }
  }

  /// Étape 2 : Vérification OTP — valide le code et connecte l'utilisateur.
  /// Retourne true si le code est correct et la session est ouverte.
  Future<bool> verifyOtp(String email, String code) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/auth/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': code}),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        final data = body['data'];
        final token = data?['accessToken'];
        if (token != null) {
          _token = token;
          _currentUser = UserModel.fromJson(Map<String, dynamic>.from(data['user']));
          await _storage.setToken(_token!);
          await _storage.setStringPref(AppConfig.userKey, jsonEncode(data['user']));
          _isAuthenticated = true;
          notifyListeners();
        }
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('VerifyOtp error: $e');
      return false;
    }
  }

  /// Renvoi du code OTP — retourne true si le renvoi a réussi.
  Future<bool> resendOtp(String email) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.baseUrl}/auth/resend-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('ResendOtp error: $e');
      return false;
    }
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    _isAuthenticated = false;
    await _storage.clearToken();
    await _storage.clearPref(AppConfig.userKey);
    notifyListeners();
  }

  Future<bool> checkAuth() async {
    try {
      final token = await _storage.getToken();
      final userJson = await _storage.getStringPref(AppConfig.userKey);

      if (token != null && token.isNotEmpty && userJson != null) {
        _token = token;
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
        _isAuthenticated = true;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Check auth error: $e');
      return false;
    }
  }

  /// Met à jour les données utilisateur en local après modification du profil
  void updateLocalUser(UserModel user) {
    _currentUser = user;
    _storage.setStringPref(AppConfig.userKey, jsonEncode(user.toJson()));
    notifyListeners();
  }
}