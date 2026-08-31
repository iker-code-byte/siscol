import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'theme/app_theme.dart';
import 'services/api_service.dart';
import 'services/fcm_service.dart';
import 'screens/activation_screen.dart';
import 'screens/inbox_screen.dart';
import 'screens/notification_detail_screen.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 1. Initialize Local Storage & API Service
  await ApiService.init();

  // 2. Initialize Firebase (if configuration is present)
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    await FcmService.init(
      onNotificationTapped: (notificationId) {
        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (_) => NotificationDetailScreen(notificationId: notificationId),
          ),
        );
      },
    );
  } catch (e) {
    print('[Firebase Init Warning]: $e');
  }

  // 3. Check existing authentication token
  final deviceToken = await ApiService.getDeviceToken();

  runApp(ColegioGrmApp(isLinked: deviceToken != null));
}

class ColegioGrmApp extends StatelessWidget {
  final bool isLinked;

  const ColegioGrmApp({super.key, required this.isLinked});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Colegio Gabriel René Moreno II',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      home: isLinked ? const InboxScreen() : const ActivationScreen(),
    );
  }
}
