import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/chatbot_screen.dart';
import 'screens/historique_screen.dart';
import 'screens/main_navigation.dart';
import 'screens/dossier_detail_screen.dart';
import 'screens/change_password_screen.dart';
import 'services/auth_service.dart';
import 'providers/dossier_provider.dart';
import 'config/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Initialize date formatting for French locale used in the app
  await initializeDateFormatting('fr_FR');
  runApp(const MedremboursApp());
}

class MedremboursApp extends StatelessWidget {
  const MedremboursApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => DossierProvider()),
      ],
      child: MaterialApp(
        title: 'MedRembours',
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        initialRoute: '/',
        routes: {
          '/': (_) => const SplashScreen(),
          '/login': (_) => const LoginScreen(),
          '/register': (_) => const RegisterScreen(),
          '/chatbot': (_) => const ChatbotScreen(),
          '/main': (_) => const MainNavigation(),
          '/dossiers/detail': (_) => const DossierDetailScreen(),
          '/historique': (_) => const HistoriqueScreen(),
          '/change-password': (_) => const ChangePasswordScreen(),
        },
      ),
    );
  }
}
