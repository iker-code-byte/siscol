import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../services/fcm_service.dart';
import 'activation_screen.dart';

class SettingsScreen extends StatefulWidget {
  final GuardianProfile? profile;

  const SettingsScreen({super.key, this.profile});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isSyncing = false;
  final TextEditingController _urlController = TextEditingController(text: ApiService.baseUrl);

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _handleSyncPush() async {
    setState(() => _isSyncing = true);
    final token = await FcmService.syncTokenWithBackend();
    setState(() => _isSyncing = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(token != null ? 'Push sincronizado con éxito' : 'No se pudo obtener el token Push'),
          backgroundColor: token != null ? Colors.green : Colors.red,
        ),
      );
    }
  }

  Future<void> _handleUnlink() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Desvincular este Teléfono?'),
        content: const Text(
          'Dejará de recibir alertas y notificaciones hasta ingresar un nuevo código emitido por el colegio.',
          style: TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Desvincular'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ApiService.unlinkDevice();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const ActivationScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ajustes del Dispositivo'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Device Info Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'INFORMACIÓN DE VINCULACIÓN',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.person, color: Color(0xFF0D5C3A)),
                    title: const Text('Tutor Titular', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    subtitle: Text(
                      widget.profile?.fullName ?? 'Tutor Registrado',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                  const Divider(height: 1),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.phone_android, color: Color(0xFF0D5C3A)),
                    title: const Text('Dispositivo Autorizado', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    subtitle: Text(
                      widget.profile?.deviceName ?? 'App Móvil Nativa',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Push Notifications Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'NOTIFICACIONES PUSH (FCM)',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Las alertas se reciben mediante el servicio en segundo plano de Google/Apple con alta prioridad.',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: _isSyncing ? null : _handleSyncPush,
                      icon: const Icon(Icons.sync),
                      label: Text(_isSyncing ? 'Sincronizando...' : 'Re-sincronizar Notificaciones Push'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Backend Server URL Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SERVIDOR BACKEND',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _urlController,
                    decoration: const InputDecoration(
                      labelText: 'URL Base de la API',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton(
                    onPressed: () async {
                      await ApiService.setBaseUrl(_urlController.text.trim());
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('URL del servidor guardada')),
                        );
                      }
                    },
                    child: const Text('Actualizar Servidor'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Danger Zone: Unlink
          Card(
            color: Colors.red.withOpacity(0.05),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.red.withOpacity(0.3)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'ZONA DE SEGURIDAD',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.red),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Si desvincula este dispositivo, no podrá consultar la bandeja ni recibir avisos hasta solicitar un nuevo código.',
                    style: TextStyle(fontSize: 12, color: Colors.black87),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _handleUnlink,
                      icon: const Icon(Icons.phonelink_erase),
                      label: const Text('Desvincular este Teléfono'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
