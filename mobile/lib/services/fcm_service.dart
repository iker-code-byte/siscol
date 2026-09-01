import 'dart:async';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import '../models/notification_model.dart';

// Top-level Background message handler
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('[FCM Background] Recibido mensaje: ${message.messageId}');
}

class FcmService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  static Timer? _livePollTimer;
  static final Set<String> _seenNotificationIds = {};
  static Function(String notificationId)? _onTapCallback;

  static const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'colegio_grm_alerts',
    'Alertas Académicas y Asistencia',
    description: 'Notificaciones prioritarias para padres y tutores',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  static Future<void> init({Function(String notificationId)? onNotificationTapped}) async {
    _onTapCallback = onNotificationTapped;

    // 1. Request OS Permission
    try {
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      print('[FCM] Estado de permiso: ${settings.authorizationStatus}');
    } catch (e) {
      print('[FCM Permission Warning]: $e');
    }

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
        if (response.payload != null && _onTapCallback != null) {
          _onTapCallback!(response.payload!);
        }
      },
    );

    // 3. Create Android High Priority Notification Channel
    if (Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }

    // 4. Listen for Foreground FCM Messages
    try {
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('[FCM Foreground] Mensaje recibido: ${message.notification?.title}');
        
        final notification = message.notification;
        final data = message.data;

        if (notification != null) {
          showNotification(
            id: notification.hashCode,
            title: notification.title ?? 'Colegio Gabriel René Moreno II',
            body: notification.body ?? 'Tiene una nueva notificación académica.',
            payload: data['notification_id'] ?? '',
          );
        }
      });

      // 5. Notification Tap from Background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        final notifId = message.data['notification_id'];
        if (notifId != null && _onTapCallback != null) {
          _onTapCallback!(notifId);
        }
      });
    } catch (e) {
      print('[FCM Listener Warning]: $e');
    }
  }

  // Display a high priority system notification popup
  static Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    await _localNotifications.show(
      id,
      title,
      body,
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
      payload: payload,
    );
  }

  // Sync token with backend (with resilient fallback for dev)
  static Future<String> syncTokenWithBackend() async {
    String token = '';
    
    // 1. Try real FCM token
    try {
      final fcmToken = await _messaging.getToken();
      if (fcmToken != null && fcmToken.isNotEmpty) {
        token = fcmToken;
      }
    } catch (e) {
      print('[FCM] Fallback a token local de desarrollo: $e');
    }

    // 2. Fallback token if real FCM token fails in dev
    if (token.isEmpty) {
      token = 'fcm_dev_token_${DateTime.now().millisecondsSinceEpoch}';
    }

    // Register token with backend
    await ApiService.registerPushSubscription(token);

    // Start live sync service
    startLivePolling();

    return token;
  }

  // Live Sync Service: Checks backend for new alerts and triggers system notification popup
  static void startLivePolling() {
    _livePollTimer?.cancel();
    
    // Pre-populate seen IDs on first launch
    ApiService.getNotifications().then((list) {
      for (var item in list) {
        _seenNotificationIds.add(item.id);
      }
    }).catchError((_) {});

    _livePollTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      final devToken = await ApiService.getDeviceToken();
      if (devToken == null) return;

      try {
        final list = await ApiService.getNotifications();
        for (var item in list) {
          if (!_seenNotificationIds.contains(item.id)) {
            _seenNotificationIds.add(item.id);
            // Trigger high priority system notification on the phone
            await showNotification(
              id: item.id.hashCode,
              title: item.safeTitle,
              body: item.detailedTitle,
              payload: item.id,
            );
          }
        }
      } catch (_) {}
    });
  }

  static void stopLivePolling() {
    _livePollTimer?.cancel();
  }
}
