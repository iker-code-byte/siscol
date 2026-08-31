class GuardianInboxItem {
  final String id;
  final String category;
  final String categoryDisplay;
  final String studentDisplay;
  final String detailedTitle;
  final String safeTitle;
  final bool isRead;
  final String? readAt;
  final DateTime createdAt;

  GuardianInboxItem({
    required this.id,
    required this.category,
    required this.categoryDisplay,
    required this.studentDisplay,
    required this.detailedTitle,
    required this.safeTitle,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory GuardianInboxItem.fromJson(Map<String, dynamic> json) {
    return GuardianInboxItem(
      id: json['id'] ?? '',
      category: json['category'] ?? 'ACADEMIC_ALERT',
      categoryDisplay: json['category_display'] ?? 'Alerta Académica',
      studentDisplay: json['student_display'] ?? '',
      detailedTitle: json['detailed_title'] ?? '',
      safeTitle: json['safe_title'] ?? 'Colegio Gabriel René Moreno II',
      isRead: json['is_read'] ?? false,
      readAt: json['read_at'],
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class GuardianNotificationDetail {
  final String id;
  final String category;
  final String categoryDisplay;
  final String studentDisplay;
  final String studentCode;
  final String detailedTitle;
  final String detailedBody;
  final Map<String, dynamic> metadata;
  final bool isRead;
  final String? readAt;
  final DateTime createdAt;

  GuardianNotificationDetail({
    required this.id,
    required this.category,
    required this.categoryDisplay,
    required this.studentDisplay,
    required this.studentCode,
    required this.detailedTitle,
    required this.detailedBody,
    required this.metadata,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory GuardianNotificationDetail.fromJson(Map<String, dynamic> json) {
    return GuardianNotificationDetail(
      id: json['id'] ?? '',
      category: json['category'] ?? 'ACADEMIC_ALERT',
      categoryDisplay: json['category_display'] ?? 'Alerta Académica',
      studentDisplay: json['student_display'] ?? '',
      studentCode: json['student_code'] ?? '',
      detailedTitle: json['detailed_title'] ?? '',
      detailedBody: json['detailed_body'] ?? '',
      metadata: (json['metadata'] is Map) ? json['metadata'] : {},
      isRead: json['is_read'] ?? false,
      readAt: json['read_at'],
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class GuardianProfile {
  final String id;
  final String fullName;
  final String? phone;
  final String? email;
  final String deviceName;
  final String platform;
  final bool pushEnabled;
  final List<GuardianStudentLink> students;

  GuardianProfile({
    required this.id,
    required this.fullName,
    this.phone,
    this.email,
    required this.deviceName,
    required this.platform,
    required this.pushEnabled,
    required this.students,
  });

  factory GuardianProfile.fromJson(Map<String, dynamic> json) {
    final g = json['guardian'] ?? {};
    final d = json['device'] ?? {};
    final rawStudents = json['students'] as List? ?? [];

    return GuardianProfile(
      id: g['id'] ?? '',
      fullName: g['full_name'] ?? '',
      phone: g['phone'],
      email: g['email'],
      deviceName: d['name'] ?? 'Dispositivo Móvil',
      platform: d['platform'] ?? 'ANDROID_APP',
      pushEnabled: json['push_enabled'] ?? false,
      students: rawStudents.map((s) => GuardianStudentLink.fromJson(s)).toList(),
    );
  }
}

class GuardianStudentLink {
  final String id;
  final String fullName;
  final String code;
  final String relationship;

  GuardianStudentLink({
    required this.id,
    required this.fullName,
    required this.code,
    required this.relationship,
  });

  factory GuardianStudentLink.fromJson(Map<String, dynamic> json) {
    return GuardianStudentLink(
      id: json['id'] ?? '',
      fullName: json['full_name'] ?? '',
      code: json['code'] ?? '',
      relationship: json['relationship'] ?? '',
    );
  }
}
