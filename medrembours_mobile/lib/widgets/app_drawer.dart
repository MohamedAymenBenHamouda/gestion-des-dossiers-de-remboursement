import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/app_theme.dart';
import '../services/auth_service.dart';

class AppDrawer extends StatelessWidget {
  /// Index de l'écran actif dans la BottomNav (0=Accueil, 1=Dossiers, 2=Profil)
  final int currentIndex;
  final ValueChanged<int> onNavigate;

  const AppDrawer({
    Key? key,
    required this.currentIndex,
    required this.onNavigate,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthService>(context).currentUser;

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.78,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0F172A), Color(0xFF1E3A5F)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ─── Header utilisateur ───
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
                child: Row(
                  children: [
                    // Avatar
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppTheme.primary, AppTheme.accent],
                        ),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withOpacity(0.25),
                          width: 2.5,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        user?.initials ?? '?',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName ?? 'Assuré',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 3),
                          Text(
                            user?.email ?? '',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.55),
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.success.withOpacity(0.25),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                  color: AppTheme.success.withOpacity(0.5)),
                            ),
                            child: const Text(
                              '● Assuré actif',
                              style: TextStyle(
                                color: AppTheme.success,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Divider
              Container(
                height: 1,
                margin: const EdgeInsets.symmetric(horizontal: 20),
                color: Colors.white.withOpacity(0.1),
              ),
              const SizedBox(height: 16),

              // ─── Navigation items ───
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _DrawerItem(
                      icon: Icons.home_outlined,
                      activeIcon: Icons.home,
                      label: 'Accueil',
                      isActive: currentIndex == 0,
                      onTap: () {
                        Navigator.pop(context);
                        onNavigate(0);
                      },
                    ),
                    _DrawerItem(
                      icon: Icons.folder_open_outlined,
                      activeIcon: Icons.folder,
                      label: 'Mes dossiers',
                      isActive: currentIndex == 1,
                      onTap: () {
                        Navigator.pop(context);
                        onNavigate(1);
                      },
                    ),
                    _DrawerItem(
                      icon: Icons.person_outline,
                      activeIcon: Icons.person,
                      label: 'Mon profil',
                      isActive: currentIndex == 2,
                      onTap: () {
                        Navigator.pop(context);
                        onNavigate(2);
                      },
                    ),

                    const SizedBox(height: 8),
                    _DrawerSectionTitle('Outils'),
                    const SizedBox(height: 4),

                    _DrawerItem(
                      icon: Icons.chat_bubble_outline,
                      activeIcon: Icons.chat_bubble,
                      label: 'Assistant IA',
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/chatbot');
                      },
                    ),
                    _DrawerItem(
                      icon: Icons.history_outlined,
                      activeIcon: Icons.history,
                      label: 'Historique',
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/historique');
                      },
                    ),
                  ],
                ),
              ),

              // Divider
              Container(
                height: 1,
                margin: const EdgeInsets.symmetric(horizontal: 20),
                color: Colors.white.withOpacity(0.1),
              ),
              const SizedBox(height: 12),

              // ─── Bouton déconnexion ───
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                child: const _DrawerLogoutButton(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
// Drawer Item
// ═══════════════════════════════════════════════
class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _DrawerItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          splashColor: Colors.white.withOpacity(0.08),
          highlightColor: Colors.white.withOpacity(0.05),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
            decoration: BoxDecoration(
              color: isActive
                  ? Colors.white.withOpacity(0.12)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
              border: isActive
                  ? Border.all(color: Colors.white.withOpacity(0.15))
                  : null,
            ),
            child: Row(
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  color: isActive ? Colors.white : Colors.white.withOpacity(0.6),
                  size: 20,
                ),
                const SizedBox(width: 14),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight:
                        isActive ? FontWeight.w700 : FontWeight.w500,
                    color:
                        isActive ? Colors.white : Colors.white.withOpacity(0.7),
                  ),
                ),
                if (isActive) ...[
                  const Spacer(),
                  Container(
                    width: 6,
                    height: 6,
                    decoration: const BoxDecoration(
                      color: AppTheme.accent,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
// Section Title
// ═══════════════════════════════════════════════
class _DrawerSectionTitle extends StatelessWidget {
  final String title;
  const _DrawerSectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 2),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: Colors.white.withOpacity(0.35),
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════
// Logout Button
// ═══════════════════════════════════════════════
class _DrawerLogoutButton extends StatelessWidget {
  const _DrawerLogoutButton();

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: () => _showLogoutDialog(context),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          decoration: BoxDecoration(
            color: AppTheme.danger.withOpacity(0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.danger.withOpacity(0.3)),
          ),
          child: const Row(
            children: [
              Icon(Icons.logout, color: AppTheme.danger, size: 20),
              SizedBox(width: 14),
              Text(
                'Déconnexion',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.danger,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext drawerCtx) {
    // Récupérer le navigator root AVANT de fermer le drawer
    final navigator = Navigator.of(drawerCtx, rootNavigator: true);
    final authService = Provider.of<AuthService>(drawerCtx, listen: false);

    Navigator.pop(drawerCtx); // fermer le drawer

    showDialog(
      context: navigator.context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Déconnexion',
            style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(dialogCtx);
              // ✅ Effacer token + session, puis naviguer vers /login
              await authService.logout();
              navigator.pushNamedAndRemoveUntil('/login', (route) => false);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
            child: const Text('Déconnexion',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
