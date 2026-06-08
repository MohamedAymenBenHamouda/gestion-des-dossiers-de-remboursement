import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_service.dart';
import '../services/profile_service.dart';

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _currentPwdCtrl = TextEditingController();
  final _newPwdCtrl = TextEditingController();
  final _confirmPwdCtrl = TextEditingController();

  bool _isLoading = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  String? _errorMessage;
  String? _successMessage;

  late AnimationController _animController;
  late Animation<Offset> _slideAnim;
  late Animation<double> _fadeAnim;

  // Critères de validation du mot de passe
  bool get _hasMinLength => _newPwdCtrl.text.length >= 12;
  bool get _hasUppercase => _newPwdCtrl.text.contains(RegExp(r'[A-Z]'));
  bool get _hasLowercase => _newPwdCtrl.text.contains(RegExp(r'[a-z]'));
  bool get _hasDigit => _newPwdCtrl.text.contains(RegExp(r'\d'));
  bool get _hasSpecial => _newPwdCtrl.text.contains(RegExp(r'[\W_]'));

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.12),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOut));
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeIn);
    _animController.forward();

    _newPwdCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _animController.dispose();
    _currentPwdCtrl.dispose();
    _newPwdCtrl.dispose();
    _confirmPwdCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleChangePassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _successMessage = null;
    });

    try {
      final profileService = await ProfileService.create();
      final ok = await profileService.changerMotDePasse(
        _currentPwdCtrl.text,
        _newPwdCtrl.text,
      );

      if (!mounted) return;

      if (ok) {
        setState(() {
          _successMessage = 'Mot de passe changé avec succès !';
          _isLoading = false;
        });
        await Future.delayed(const Duration(milliseconds: 1200));
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/main');
      } else {
        setState(() {
          _errorMessage = 'Mot de passe actuel incorrect ou erreur serveur.';
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = 'Erreur réseau. Vérifiez votre connexion.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false, // bloque le bouton retour
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          color: AppTheme.background,
          child: SafeArea(
            child: SingleChildScrollView(
              child: Column(
                children: [
                  // ── Hero Banner ──
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 28, vertical: 44),
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0xFF0F172A),
                          Color(0xFF1E3A5F),
                          AppTheme.primaryDark,
                        ],
                      ),
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(32),
                        bottomRight: Radius.circular(32),
                      ),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.12),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withOpacity(0.2),
                              width: 1.5,
                            ),
                          ),
                          child: const Icon(
                            Icons.lock_reset_rounded,
                            size: 48,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 18),
                        const Text(
                          'Changement de mot de passe',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: -0.4,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(
                                color: Colors.amber.withOpacity(0.4)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.info_outline,
                                  color: Colors.amber, size: 16),
                              SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  'Votre compte requiert un nouveau mot de passe',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.amber,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Form ──
                  SlideTransition(
                    position: _slideAnim,
                    child: FadeTransition(
                      opacity: _fadeAnim,
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            const SizedBox(height: 4),

                            // Message d'erreur
                            if (_errorMessage != null)
                              _buildAlert(
                                  _errorMessage!, AppTheme.danger, Icons.error_outline),

                            // Message de succès
                            if (_successMessage != null)
                              _buildAlert(
                                  _successMessage!, AppTheme.success, Icons.check_circle_outline),

                            // Formulaire
                            Card(
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                                side: const BorderSide(
                                    color: Color(0xFFE5E7EB)),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(24),
                                child: Form(
                                  key: _formKey,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Créer un nouveau mot de passe',
                                        style: TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      const Text(
                                        'Votre administrateur a créé ce compte. Veuillez définir votre propre mot de passe.',
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                      const SizedBox(height: 24),

                                      // Mot de passe actuel (temporaire)
                                      _buildLabel('Mot de passe temporaire'),
                                      const SizedBox(height: 6),
                                      TextFormField(
                                        controller: _currentPwdCtrl,
                                        obscureText: _obscureCurrent,
                                        decoration: InputDecoration(
                                          hintText: 'Mot de passe envoyé par email',
                                          prefixIcon: const Icon(
                                              Icons.lock_outline, size: 20),
                                          suffixIcon: _toggleIcon(
                                            _obscureCurrent,
                                            () => setState(() =>
                                                _obscureCurrent = !_obscureCurrent),
                                          ),
                                        ),
                                        validator: (v) =>
                                            v == null || v.isEmpty
                                                ? 'Champ requis'
                                                : null,
                                      ),
                                      const SizedBox(height: 20),

                                      // Nouveau mot de passe
                                      _buildLabel('Nouveau mot de passe'),
                                      const SizedBox(height: 6),
                                      TextFormField(
                                        controller: _newPwdCtrl,
                                        obscureText: _obscureNew,
                                        decoration: InputDecoration(
                                          hintText: '••••••••••••',
                                          prefixIcon: const Icon(
                                              Icons.lock_open_outlined,
                                              size: 20),
                                          suffixIcon: _toggleIcon(
                                            _obscureNew,
                                            () => setState(() =>
                                                _obscureNew = !_obscureNew),
                                          ),
                                        ),
                                        validator: (v) {
                                          if (v == null || v.isEmpty)
                                            return 'Champ requis';
                                          if (!RegExp(
                                                  r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$')
                                              .hasMatch(v)) {
                                            return 'Le mot de passe ne respecte pas les critères';
                                          }
                                          return null;
                                        },
                                      ),
                                      const SizedBox(height: 14),

                                      // Indicateurs de force
                                      _buildStrengthIndicators(),
                                      const SizedBox(height: 20),

                                      // Confirmer mot de passe
                                      _buildLabel('Confirmer le mot de passe'),
                                      const SizedBox(height: 6),
                                      TextFormField(
                                        controller: _confirmPwdCtrl,
                                        obscureText: _obscureConfirm,
                                        decoration: InputDecoration(
                                          hintText: '••••••••••••',
                                          prefixIcon: const Icon(
                                              Icons.check_circle_outline,
                                              size: 20),
                                          suffixIcon: _toggleIcon(
                                            _obscureConfirm,
                                            () => setState(() =>
                                                _obscureConfirm =
                                                    !_obscureConfirm),
                                          ),
                                        ),
                                        validator: (v) {
                                          if (v == null || v.isEmpty)
                                            return 'Champ requis';
                                          if (v != _newPwdCtrl.text)
                                            return 'Les mots de passe ne correspondent pas';
                                          return null;
                                        },
                                      ),
                                      const SizedBox(height: 28),

                                      // Bouton
                                      SizedBox(
                                        width: double.infinity,
                                        height: 52,
                                        child: ElevatedButton(
                                          onPressed: _isLoading
                                              ? null
                                              : _handleChangePassword,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.primary,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                          ),
                                          child: _isLoading
                                              ? const SizedBox(
                                                  height: 22,
                                                  width: 22,
                                                  child:
                                                      CircularProgressIndicator(
                                                    color: Colors.white,
                                                    strokeWidth: 2,
                                                  ),
                                                )
                                              : const Text(
                                                  'Confirmer le nouveau mot de passe',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),

                            const SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.security,
                                    size: 14,
                                    color: AppTheme.textSecondary.withOpacity(0.5)),
                                const SizedBox(width: 6),
                                Text(
                                  'Cette étape est obligatoire pour la sécurité de votre compte.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color:
                                        AppTheme.textSecondary.withOpacity(0.6),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAlert(String message, Color color, IconData icon) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStrengthIndicators() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Critères requis :',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppTheme.textSecondary,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: [
            _buildCriteria('12 caractères min.', _hasMinLength),
            _buildCriteria('Majuscule', _hasUppercase),
            _buildCriteria('Minuscule', _hasLowercase),
            _buildCriteria('Chiffre', _hasDigit),
            _buildCriteria('Caractère spécial', _hasSpecial),
          ],
        ),
      ],
    );
  }

  Widget _buildCriteria(String label, bool met) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: met
            ? AppTheme.success.withOpacity(0.1)
            : const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: met ? AppTheme.success.withOpacity(0.4) : const Color(0xFFE5E7EB),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            met ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 13,
            color: met ? AppTheme.success : AppTheme.textSecondary,
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: met ? AppTheme.success : AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppTheme.textSecondary,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _toggleIcon(bool obscure, VoidCallback onTap) {
    return IconButton(
      icon: Icon(
        obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
        size: 20,
        color: AppTheme.textSecondary,
      ),
      onPressed: onTap,
    );
  }
}
