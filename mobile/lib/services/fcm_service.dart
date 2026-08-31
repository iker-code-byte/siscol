import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

// Top-level Background message handler
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('[FCM Background] Recibido mensaje: ${message.messageId}');
}

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'colegio_grm_alerts', // id matching backend
    'Alertas Académicas y Asistencia', // title
    description: 'Notificaciones prioritarias para padres y tutores',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  static Future<void> init({Function(String notificationId)? onNotificationTapped}) async {
    // 1. Request OS Permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    print('[FCM] Estado de permiso: ${settings.authorizationStatus}');

    // 2. Initialize Local Notifications Plugin for Android/iOS
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (response.payload != null && onNotificationTapped != null) {
          onNotificationTapped(response.payload!);
        }
      },
    );

    // 3. Create Android High Priority Notification Channel
    if (Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }

    // 4. Listen for Foreground Messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('[FCM Foreground] Mensaje recibido: ${message.notification?.title}');
      
      final notification = message.notification;
      final android = message.notification?.android;
      final data = message.data;

      if (notification != null) {
        _localNotifications.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              importance: Importance.max,
              priority: Priority.high,
              playSound: true,
              enableVibration: true,
              icon: '@mipmap/ic_launcher',
            ),
            iOS: const DarwinNotificationDetails(
              presentAlert: true,
              presentBadge: true,
              presentSound: true,
            ),
          ),
          payload: data['notification_id'],
        );
      }
    });

    // 5. Notification Tap from Background / Terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      final notifId = message.data['notification_id'];
      if (notifId != null && onNotificationTapped != null) {
        onNotificationTapped(notifId);
      }
    });
  }

  static Future<String?> syncTokenWithBackend() async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        print('[FCM Token]: $token');
        await ApiService.registerPushSubscription(token);
        return token;
      }
    } catch (e) {
      print('[FCM Token Error]: $e');
    }
    return null;
  }
}
