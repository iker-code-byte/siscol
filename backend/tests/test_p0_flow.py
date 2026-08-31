import pytest
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.accounts.models import User, RoleChoices
from apps.academics.models import (
    AcademicYear, Course, Subject, Teacher, Student, Guardian, 
    StudentGuardian, Enrollment, TeachingAssignment, RelationshipChoices
)
from apps.grades.models import Grade
from apps.attendance.models import Attendance, AttendanceStatusChoices
from apps.alerts.models import NotificationRule, AlertEvent, NotificationRuleTypeChoices
from apps.guardians.models import GuardianActivationCode, GuardianDevice, PushSubscription
from apps.guardians.services import GuardianActivationService
from apps.notifications.models import Notification, NotificationDelivery

class BaseP0TestCase(APITestCase):
    def setUp(self):
        # 1. Admin
        self.admin_user = User.objects.create_user(
            username='admin_test',
            password='Password123!',
            role=RoleChoices.ADMIN,
            is_staff=True,
            is_superuser=True
        )

        # 2. Teacher 1
        self.teacher1_user = User.objects.create_user(
            username='teacher1',
            password='Password123!',
            role=RoleChoices.TEACHER
        )
        self.teacher1 = Teacher.objects.create(
            user=self.teacher1_user,
            first_name='Carlos',
            last_name='Mamani'
        )

        # 3. Teacher 2 (Other teacher)
        self.teacher2_user = User.objects.create_user(
            username='teacher2',
            password='Password123!',
            role=RoleChoices.TEACHER
        )
        self.teacher2 = Teacher.objects.create(
            user=self.teacher2_user,
            first_name='Ana',
            last_name='Vaca'
        )

        # 4. Student 1 & 2
        self.student1_user = User.objects.create_user(
            username='student1',
            password='Password123!',
            role=RoleChoices.STUDENT
        )
        self.student1 = Student.objects.create(
            user=self.student1_user,
            code='RUDE-001',
            first_name='Juan',
            last_name='Perez'
        )

        self.student2_user = User.objects.create_user(
            username='student2',
            password='Password123!',
            role=RoleChoices.STUDENT
        )
        self.student2 = Student.objects.create(
            user=self.student2_user,
            code='RUDE-002',
            first_name='Sofia',
            last_name='Fernandez'
        )

        # 5. Guardian
        self.guardian = Guardian.objects.create(
            full_name='Maria Gomez',
            phone='71234567',
            notifications_enabled=True,
            active=True
        )
        StudentGuardian.objects.create(
            student=self.student1,
            guardian=self.guardian,
            relationship=RelationshipChoices.MOTHER,
            can_receive_notifications=True
        )

        # 6. Academic structure
        self.year = AcademicYear.objects.create(
            name='2026',
            start_date=date(2026, 2, 1),
            end_date=date(2026, 11, 30),
            active=True
        )
        self.course = Course.objects.create(
            academic_year=self.year,
            name='1ro Secundaria',
            parallel='A'
        )
        self.subject_math = Subject.objects.create(
            name='Matematicas',
            code='MAT-101'
        )
        self.subject_lang = Subject.objects.create(
            name='Lenguaje',
            code='LEN-101'
        )

        # Enrollments
        Enrollment.objects.create(student=self.student1, course=self.course, academic_year=self.year)
        Enrollment.objects.create(student=self.student2, course=self.course, academic_year=self.year)

        # Assignments
        self.assign_teacher1 = TeachingAssignment.objects.create(
            teacher=self.teacher1,
            course=self.course,
            subject=self.subject_math,
            academic_year=self.year
        )
        self.assign_teacher2 = TeachingAssignment.objects.create(
            teacher=self.teacher2,
            course=self.course,
            subject=self.subject_lang,
            academic_year=self.year
        )

        # Rules
        self.rule_low_grade = NotificationRule.objects.create(
            name='Alerta Nota Baja (<51)',
            type=NotificationRuleTypeChoices.LOW_GRADE,
            threshold_value=Decimal('51.00'),
            enabled=True
        )
        self.rule_absence = NotificationRule.objects.create(
            name='Alerta Falta',
            type=NotificationRuleTypeChoices.ABSENCE,
            enabled=True
        )

class AuthAndRBACTests(BaseP0TestCase):
    def test_login_and_token_issue(self):
        client = APIClient()
        response = client.post('/api/auth/login/', {
            'username': 'admin_test',
            'password': 'Password123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertEqual(response.data['user']['role'], 'ADMIN')

    def test_student_cannot_access_admin_endpoints(self):
        client = APIClient()
        client.force_authenticate(user=self.student1_user)
        response = client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_grade_other_teacher_assignment(self):
        client = APIClient()
        client.force_authenticate(user=self.teacher1_user)
        # Attempt to save grades on teacher2's assignment
        response = client.post('/api/grades/bulk/', {
            'teaching_assignment_id': str(self.assign_teacher2.id),
            'term': 'T1',
            'activity_name': 'Examen',
            'max_score': 100,
            'date': '2026-03-01',
            'grades': [
                {'student_id': str(self.student1.id), 'score': 70}
            ]
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

class GradesAndAlertTests(BaseP0TestCase):
    def test_bulk_grades_and_low_grade_alert(self):
        client = APIClient()
        client.force_authenticate(user=self.teacher1_user)

        # Student 1 gets 35/100 (below 51), Student 2 gets 85/100
        response = client.post('/api/grades/bulk/', {
            'teaching_assignment_id': str(self.assign_teacher1.id),
            'term': 'T1',
            'activity_name': 'Examen 1',
            'max_score': 100,
            'date': '2026-03-10',
            'grades': [
                {'student_id': str(self.student1.id), 'score': 35},
                {'student_id': str(self.student2.id), 'score': 85}
            ]
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Grade.objects.count(), 2)

        # Check AlertEvent created for student 1 only
        alerts = AlertEvent.objects.filter(student=self.student1)
        self.assertEqual(alerts.count(), 1)
        self.assertEqual(alerts.first().rule, self.rule_low_grade)

        # Check Notification created for guardian of student 1
        notifs = Notification.objects.filter(student=self.student1, guardian=self.guardian)
        self.assertEqual(notifs.count(), 1)
        notif = notifs.first()
        self.assertEqual(notif.safe_title, 'Colegio Gabriel René Moreno II')
        self.assertIn('notificación académica', notif.safe_body)
        self.assertIn('35', notif.detailed_body)

    def test_student_me_grades_isolation(self):
        Grade.objects.create(
            student=self.student1,
            teaching_assignment=self.assign_teacher1,
            term='T1',
            activity_name='Tarea 1',
            score=90,
            max_score=100,
            date='2026-03-01'
        )
        Grade.objects.create(
            student=self.student2,
            teaching_assignment=self.assign_teacher1,
            term='T1',
            activity_name='Tarea 1',
            score=40,
            max_score=100,
            date='2026-03-01'
        )

        client = APIClient()
        client.force_authenticate(user=self.student1_user)
        response = client.get('/api/me/grades/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see 1 grade (student 1)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['student_name'], 'Juan Perez')

class GuardianActivationAndDeviceTests(BaseP0TestCase):
    def test_guardian_activation_flow(self):
        # Admin generates code
        code_obj, plain_code = GuardianActivationService.generate_code(
            guardian=self.guardian,
            created_by=self.admin_user
        )

        client = APIClient()
        # Verify code
        response = client.post('/api/guardian/activation/verify/', {
            'code': plain_code,
            'device_name': 'iPhone de Maria',
            'platform': 'IOS_PWA'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('device_token', response.data)
        device_token = response.data['device_token']

        # Verify device is linked and code is used
        device = GuardianDevice.objects.get(device_token=device_token)
        self.assertTrue(device.is_active)
        code_obj.refresh_from_db()
        self.assertIsNotNone(code_obj.used_at)

        # Attempt to reuse code must fail
        response_reuse = client.post('/api/guardian/activation/verify/', {
            'code': plain_code,
            'device_name': 'Otro telefono'
        })
        self.assertEqual(response_reuse.status_code, status.HTTP_400_BAD_REQUEST)

        # Guardian registers push subscription with device token
        client.credentials(HTTP_AUTHORIZATION=f'DeviceToken {device_token}')
        push_resp = client.post('/api/guardian/devices/push-subscription/', {
            'token': 'mock-fcm-token-12345',
            'provider': 'FCM'
        })
        self.assertEqual(push_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(PushSubscription.objects.filter(guardian_device=device, is_active=True).count(), 1)

        # Access inbox with device auth
        inbox_resp = client.get('/api/guardian/notifications/')
        self.assertEqual(inbox_resp.status_code, status.HTTP_200_OK)
