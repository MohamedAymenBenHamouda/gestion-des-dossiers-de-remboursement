import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ChatService {
  final String? token;
  ChatService({this.token});

  Future<String> sendMessage(String message, List<Map<String, String>> history) async {
    final uri = Uri.parse('${AppConfig.baseUrl}/assure/chatbot');
    try {
      final resp = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'message': message,
          'history': history,
        }),
      );

      if (resp.statusCode == 200 || resp.statusCode == 201) {
        final body = jsonDecode(resp.body);
        return body['data'] ?? body['message'] ?? '';
      }
      throw Exception('Server returned ${resp.statusCode}');
    } catch (e) {
      rethrow;
    }
  }
}
