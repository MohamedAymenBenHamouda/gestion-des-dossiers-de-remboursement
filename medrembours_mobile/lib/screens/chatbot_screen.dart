import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> with SingleTickerProviderStateMixin {
  final List<Map<String, dynamic>> _messages = [];
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scroll = ScrollController();
  bool _loading = false;

  final List<String> _suggestions = [
    '📋 Liste de tous mes dossiers',
    '💰 Total remboursé cette année',
    '⏳ Dossiers en attente de traitement',
  ];

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
      }
    });
  }

  Future<void> _send(String text) async {
    if (text.trim().isEmpty) return;
    setState(() {
      _messages.add({'role': 'user', 'content': text, 'time': DateTime.now()});
      _loading = true;
      _controller.clear();
    });
    _scrollToBottom();

    final auth = Provider.of<AuthService>(context, listen: false);
    final chat = ChatService(token: auth.token);

    // add bot typing placeholder
    setState(() => _messages.add({'role': 'bot', 'content': '', 'loading': true, 'time': DateTime.now()}));
    _scrollToBottom();

    final history = _messages.where((m) => m['content'] != null).map((m) => {'role': m['role'] == 'user' ? 'user' : 'assistant', 'content': m['content'] as String}).toList();

    try {
      final reply = await chat.sendMessage(text, history.cast<Map<String, String>>());
      final idx = _messages.indexWhere((m) => m['loading'] == true);
      if (idx != -1) {
        _messages[idx] = {'role': 'bot', 'content': reply, 'time': DateTime.now()};
      }
    } catch (e) {
      final idx = _messages.indexWhere((m) => m['loading'] == true);
      if (idx != -1) {
        _messages[idx] = {'role': 'bot', 'content': '⚠️ Impossible de contacter le serveur.', 'time': DateTime.now()};
      }
    } finally {
      setState(() => _loading = false);
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final prenom = auth.currentUser?.prenom ?? 'Assuré';

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // header like web
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: const BoxDecoration(
                gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF0F172A), Color(0xFF1E3A5F), AppTheme.primaryDark]),
              ),
              child: Row(
                children: [
                  // Bouton retour
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 38, height: 38,
                      margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withOpacity(0.15)),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 16),
                    ),
                  ),
                  // Icône assistant
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.08), shape: BoxShape.circle, border: Border.all(color: Colors.white.withOpacity(0.12))),
                    child: const Icon(Icons.smart_toy_outlined, color: Colors.white, size: 26),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Assistant MedRembours', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppTheme.success, shape: BoxShape.circle)),
                          const SizedBox(width: 5),
                          Text('En ligne ', style: TextStyle(color: Colors.white.withOpacity(0.75), fontSize: 11)),
                        ],
                      ),
                    ]),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _messages.clear()),
                    icon: const Icon(Icons.delete_outline, color: Colors.white),
                    tooltip: 'Effacer la conversation',
                  ),
                ],
              ),
            ),

            // messages
            Expanded(
              child: Container(
                color: const Color(0xFFF9FAFB),
                child: _messages.isEmpty ? _buildWelcome(prenom) : ListView.builder(
                  controller: _scroll,
                  padding: const EdgeInsets.all(18),
                  itemCount: _messages.length,
                  itemBuilder: (ctx, i) {
                    final m = _messages[i];
                    final isUser = m['role'] == 'user';
                    if (m['loading'] == true) {
                      return Align(alignment: Alignment.centerLeft, child: _typingDots());
                    }
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                        decoration: BoxDecoration(color: isUser ? AppTheme.primary : Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: isUser ? null : [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)]),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(m['content'] ?? '', style: TextStyle(color: isUser ? Colors.white : AppTheme.textPrimary)),
                          const SizedBox(height: 6),
                          Align(alignment: Alignment.bottomRight, child: Text(_formatTime(m['time'] as DateTime), style: TextStyle(fontSize: 10, color: (isUser ? Colors.white70 : AppTheme.textSecondary))))
                        ]),
                      ),
                    );
                  },
                ),
              ),
            ),

            // quick actions when there are messages
            if (_messages.isNotEmpty && !_loading)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                color: const Color(0xFFF9FAFB),
                child: Wrap(spacing: 8, children: _suggestions.map((s) => ActionChip(label: Text(s), onPressed: () => _send(s))).toList()),
              ),

            // input
            Container(
              padding: const EdgeInsets.all(12),
              color: Colors.white,
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    minLines: 1,
                    maxLines: 5,
                    textInputAction: TextInputAction.send,
                    decoration: const InputDecoration(hintText: 'Posez votre question sur vos dossiers...', border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(10)), borderSide: BorderSide(color: Color(0xFFEAEEF3)))),
                    onSubmitted: (v) => _send(v),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 48,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, shape: const CircleBorder()),
                    onPressed: _loading ? null : () => _send(_controller.text),
                    child: _loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.send),
                  ),
                )
              ]),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildWelcome(String prenom) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        const SizedBox(height: 20),
        Container(padding: const EdgeInsets.all(18), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]), child: Column(children: [
          const Icon(Icons.smart_toy_outlined, size: 52, color: AppTheme.primary),
          const SizedBox(height: 12),
          Text('Bonjour $prenom !', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          const Text('Je suis votre assistant pour vos dossiers de remboursement médical.', textAlign: TextAlign.center),
          const SizedBox(height: 12),
          Wrap(spacing: 8, children: _suggestions.map((s) => OutlinedButton(onPressed: () => _send(s), child: Text(s))).toList())
        ])),
        const SizedBox(height: 40)
      ]),
    );
  }

  Widget _typingDots() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)]),
      child: Row(mainAxisSize: MainAxisSize.min, children: const [
        SizedBox(width: 8),
        _Dot(),
        SizedBox(width: 6),
        _Dot(delay: 100),
        SizedBox(width: 6),
        _Dot(delay: 200),
      ]),
    );
  }

  String _formatTime(DateTime? t) {
    if (t == null) return '';
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({this.delay = 0});
  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  late final Animation<double> _a;
  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..repeat();
    _a = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.3, end: 1.0), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.3), weight: 50),
    ]).animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _a,
      builder: (ctx, ch) => Opacity(opacity: _a.value, child: Container(width: 8, height: 8, decoration: BoxDecoration(color: AppTheme.textSecondary, shape: BoxShape.circle))),
    );
  }
}
