import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification_model.dart';

class ApiService {
  // Default to Android Emulator loopback or local LAN. Can be modified in settings.
  static String baseUrl = 'http://10.0.2.2:8000/api';

  static const String keyDeviceToken = 'guardian_device_token';
  static const String keyBaseUrl = 'custom_base_url';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString(keyBaseUrl);
    if (customUrl != null && customUrl.isNotEmpty) {
      baseUrl = customUrl;
    }
  }

  static Future<void> setBaseUrl(String url) async {
    baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(keyBaseUrl, url);
  }

  static Future<String?> getDeviceToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(keyDeviceToken);
  }

  static Future<void> saveDeviceToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(keyDeviceToken, token);
  }

  static Future<void> clearDeviceToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(keyDeviceToken);
  }

  static Future<Map<String, String>> _getHeaders() async {
    final token = await getDeviceToken();
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-store',
    };
    if (token != null) {
      headers['Authorization'] = 'DeviceToken $token';
    }
    return headers;
  }

  // 1. Verify Activation Code
  static Future<Map<String, dynamic>> activateDevice(String code, {String? deviceName}) async {
    final platform = Platform.isAndroid ? 'ANDROID_APP' : 'IOS_APP';
    final url = Uri.parse('$baseUrl/guardian/activation/verify/');
    
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
      body: jsonEncode({
        'code': code.trim().toUpperCase(),
        'device_name': deviceName ?? (Platform.isAndroid ? 'Teléfono Android' : 'iPhone'),
        'platform': platform,
      }),
    );

    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final devToken = data['device_token'];
      if (devToken != null) {
        await saveDeviceToken(devToken);
      }
      return data;
    } else {
      throw Exception(data['detail'] ?? data['error'] ?? 'Código de activación inválido o expirado.');
    }
  }

  // 2. Get Guardian Profile & Linked Students
  static Future<GuardianProfile> getGuardianMe() async {
    final url = Uri.parse('$baseUrl/guardian/me/');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      return GuardianProfile.fromJson(data);
    } else {
      throw Exception('Error al obtener perfil del tutor (${response.statusCode})');
    }
  }

  // 3. Get Notifications List
  static Future<List<GuardianInboxItem>> getNotifications() async {
    final url = Uri.parse('$baseUrl/guardian/notifications/');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      final list = (data is List) ? data : (data['results'] as List? ?? []);
      return list.map((item) => GuardianInboxItem.fromJson(item)).toList();
    } else {
      throw Exception('Error al obtener notificaciones (${response.statusCode})');
    }
  }

  // 4. Get Notification Detail
  static Future<GuardianNotificationDetail> getNotificationDetail(String id) async {
    final url = Uri.parse('$baseUrl/guardian/notifications/$id/');
    final headers = await _getHeaders();
    final response = await http.get(url, headers: headers);

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      return GuardianNotificationDetail.fromJson(data);
    } else {
      throw Exception('Error al cargar detalle del aviso (${response.statusCode})');
    }
  }

  // 5. Register Native FCM Push Subscription
  static Future<bool> registerPushSubscription(String fcmToken) async {
    final platform = Platform.isAndroid ? 'ANDROID_APP' : 'IOS_APP';
    final url = Uri.parse('$baseUrl/guardian/devices/push-subscription/');
    final headers = await _getHeaders();

    final response = await http.post(
      url,
      headers: headers,
      body: jsonEncode({
        'token': fcmToken,
        'provider': 'FCM',
        'platform': platform,
      }),
    );

    return response.statusCode >= 200 && response.statusCode < 300;
  }

  // 6. Delete Push Subscription
  static Future<bool> deletePushSubscription() async {
    final url = Uri.parse('$baseUrl/guardian/devices/push-subscription/');
    final headers = await _getHeaders();
    final response = await http.delete(url, headers: headers);
    return response.statusCode == 204;
  }

  // 7. Unlink Device
  static Future<bool> unlinkDevice() async {
    final url = Uri.parse('$baseUrl/guardian/device/unlink/');
    final headers = await _getHeaders();
    final response = await http.post(url, headers: headers);
    await clearDeviceToken();
    return response.statusCode == 200;
  }
}
