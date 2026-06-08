import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class OtpInputWidget extends StatefulWidget {
  final String apiBase; // e.g. http://10.0.2.2:8089/api/auth or http://localhost:8089/api/auth
  const OtpInputWidget({Key? key, this.apiBase = 'http://10.0.2.2:8089/api/auth'}) : super(key: key);

  @override
  State<OtpInputWidget> createState() => _OtpInputWidgetState();
}

class _OtpInputWidgetState extends State<OtpInputWidget> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  bool _loading = false;
  String _message = '';

  Future<void> _verify() async {
    final email = _emailController.text.trim();
    final code = _codeController.text.trim();
    if (email.isEmpty || code.length != 6) {
      setState(() => _message = 'Email ou code invalide.');
      return;
    }
    setState(() { _loading = true; _message=''; });
    try {
      final res = await http.post(
        Uri.parse('${widget.apiBase}/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'code': code}),
      );
      if (res.statusCode == 200) {
        setState(() => _message = 'Vérification réussie.');
        // Optionally parse token: final body = jsonDecode(res.body);
      } else {
        final body = jsonDecode(res.body);
        setState(() => _message = body['message'] ?? 'Erreur de vérification');
      }
    } catch (e) {
      setState(() => _message = 'Erreur réseau: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _message = 'Entrez un email valide.');
      return;
    }
    setState(() { _loading = true; _message=''; });
    try {
      final res = await http.post(
        Uri.parse('${widget.apiBase}/resend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      if (res.statusCode == 200) {
        setState(() => _message = 'Code renvoyé.');
      } else {
        final body = jsonDecode(res.body);
        setState(() => _message = body['message'] ?? 'Erreur lors du renvoi');
      }
    } catch (e) {
      setState(() => _message = 'Erreur réseau: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Vérification par e‑mail', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(labelText: 'Code (6 chiffres)'),
            ),
            const SizedBox(height: 12),
            if (_message.isNotEmpty) Text(_message, style: const TextStyle(color: Colors.black87)),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _loading ? null : _verify,
                    child: _loading ? const SizedBox(width:16,height:16,child:CircularProgressIndicator(strokeWidth:2)) : const Text('Vérifier'),
                  ),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: _loading ? null : _resend,
                  child: const Text('Renvoyer'),
                )
              ],
            )
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    super.dispose();
  }
}
