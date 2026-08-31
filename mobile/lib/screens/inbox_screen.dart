import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../services/fcm_service.dart';
import 'notification_detail_screen.dart';
import 'settings_screen.dart';
import 'activation_screen.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  GuardianProfile? _profile;
  List<GuardianInboxItem> _notifications = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
    // Sync FCM token when inbox opens
    FcmService.syncTokenWithBackend();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final token = await ApiService.getDeviceToken();
      if (token == null) {
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const ActivationScreen()),
          );
        }
        return;
      }

      final profile = await ApiService.getGuardianMe();
      final notifs = await ApiService.getNotifications();

      if (mounted) {
        setState(() {
          _profile = profile;
          _notifications = notifs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bandeja de Avisos'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () async {
              final result = await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => SettingsScreen(profile: _profile)),
              );
              if (result == true) {
                _loadData();
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: Colors.red),
                          const SizedBox(height: 12),
                          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13)),
                          const SizedBox(height: 16),
                          ElevatedButton(onPressed: _loadData, child: const Text('Reintentar')),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16.0),
                    children: [
                      // Header Card: Guardian & Linked Students
                      if (_profile != null)
                        Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      radius: 18,
                                      backgroundColor: Color(0xFF0D5C3A),
                                      child: Icon(Icons.person, color: Colors.white, size: 20),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            _profile!.fullName,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                          ),
                                          Text(
                                            _profile!.deviceName,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isDark ? Colors.white60 : Colors.black54,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                if (_profile!.students.isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  const Divider(height: 1),
                                  const SizedBox(height: 10),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 4,
                                    children: _profile!.students.map((st) {
                                      return Chip(
                                        avatar: const Text('🎓', style: TextStyle(fontSize: 12)),
                                        label: Text(
                                          '${st.fullName} (${st.relationship})',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                                        ),
                                        padding: EdgeInsets.zero,
                                        visualDensity: VisualDensity.compact,
                                        backgroundColor: const Color(0xFF0D5C3A).withOpacity(0.08),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),

                      // Section Title
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4.0, vertical: 8.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.between,
                          children: [
                            Text(
                              'Historial de Alertas',
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white70 : Colors.black87,
                              ),
                            ),
                            Text(
                              '${_notifications.length} avisos',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.white54 : Colors.black45,
                              ),
                            ),
                          ],
                        ),
                      ),

                      if (_notifications.isEmpty)
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40.0, horizontal: 20),
                            child: Column(
                              children: [
                                const Icon(Icons.notifications_none, size: 48, color: Color(0xFF0D5C3A)),
                                const SizedBox(height: 12),
                                Text(
                                  'Bandeja al día',
                                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'No tienes alertas pendientes. Las notificaciones sobre notas o faltas aparecerán aquí.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        ..._notifications.map((item) {
                          final isAttendance = item.category == 'ATTENDANCE_ALERT';
                          final dateStr = DateFormat('dd/MM/yyyy HH:mm').format(item.createdAt);

                          return Card(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              leading: CircleAvatar(
                                radius: 20,
                                backgroundColor: isAttendance
                                    ? Colors.amber.withOpacity(0.15)
                                    : Colors.red.withOpacity(0.15),
                                child: Icon(
                                  isAttendance ? Icons.event_busy : Icons.grade,
                                  color: isAttendance ? Colors.amber[800] : Colors.red[700],
                                  size: 20,
                                ),
                              ),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.studentDisplay,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ),
                                  if (!item.isRead)
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF0D5C3A),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text(
                                    item.detailedTitle,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? Colors.white70 : Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    dateStr,
                                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                                  ),
                                ],
                              ),
                              trailing: const Icon(Icons.chevron_right, size: 20, color: Colors.grey),
                              onTap: () async {
                                await Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => NotificationDetailScreen(notificationId: item.id),
                                  ),
                                );
                                _loadData();
                              },
                            ),
                          );
                        }).toList(),
                    ],
                  ),
      ),
    );
  }
}
