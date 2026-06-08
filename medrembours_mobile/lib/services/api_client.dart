import 'dart:convert';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import 'storage_service.dart';

class ApiClient {
  final Dio _dio;
  final StorageService _storage;

  ApiClient._(this._dio, this._storage);

  static Future<ApiClient> create() async {
    final dio = Dio(BaseOptions(
      baseUrl: AppConfig.baseUrl,
      connectTimeout: Duration(milliseconds: 15000),
      receiveTimeout: Duration(milliseconds: 15000),
    ));
    final storage = StorageService();
    final client = ApiClient._(dio, storage);
    dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
      final token = await storage.getToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    }, onError: (err, handler) {
      return handler.next(err);
    }));
    return client;
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return _dio.post(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> put(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return _dio.put(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> patch(String path, {dynamic data, Map<String, dynamic>? queryParameters}) async {
    return _dio.patch(path, data: data, queryParameters: queryParameters);
  }

  Future<Response> postMultipart(String path, FormData data) async {
    return _dio.post(path, data: data, options: Options(headers: {'Content-Type': 'multipart/form-data'}));
  }
}
