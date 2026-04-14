from django.test import TestCase
from django.urls import reverse
from unittest.mock import patch
from rest_framework.test import APITestCase
from rest_framework import status

# Create your tests here.

class HealthCheckTestCase(APITestCase):
    """Test the health check endpoint"""
    
    def test_health_check(self):
        """Test that health check returns 200 OK"""
        url = reverse('health')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'healthy')


class SearchAPITestCase(APITestCase):
    """Test the search endpoint"""
    
    def test_search_without_question(self):
        """Test that search without question returns 400"""
        url = reverse('search')
        response = self.client.post(url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_search_with_question(self):
        """Test that search with question returns 200"""
        url = reverse('search')
        data = {'question': 'What is agriculture?'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overview', response.data)
        self.assertIn('documents', response.data)
        self.assertIn('related_questions', response.data)


# Example model tests (when you add models)
# class DocumentCacheModelTest(TestCase):
#     def test_create_document_cache(self):
#         doc = DocumentCache.objects.create(
#             document_key="test.txt",
#             document_data={"title": "Test"}
#         )
#         self.assertEqual(doc.document_key, "test.txt")
#         self.assertEqual(doc.status, "active")


class AuthRegisterHardeningTests(APITestCase):
    def _valid_register_payload(self):
        return {
            'email': 'hardening_user@example.com',
            'password': 'StrongPass123',
            'username': 'hardening_user',
            'full_name': 'Hardening User',
            'school_level': 'Undergraduate',
            'school_name': 'Asia Pacific College',
            'client_type': 'Student',
            'sex': 'Female',
            'age': '21-25',
            'region': 'NCR',
            'category': 'Student',
            'terms_accepted': True,
            'terms_version': 'v2026-04-01',
        }

    def test_register_rejects_invalid_school_level_enum(self):
        url = reverse('auth-register')
        payload = self._valid_register_payload()
        payload['school_level'] = 'Elementary'

        response = self.client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data.get('success', True))
        self.assertIn('Invalid school level selected', str(response.data.get('message', '')))

    def test_register_rate_limit_returns_429_when_exceeded(self):
        url = reverse('auth-register')

        with patch('rag_api.auth_views.REGISTER_RATE_LIMIT', 1), patch('rag_api.auth_views.REGISTER_RATE_WINDOW_SECONDS', 3600):
            first_payload = self._valid_register_payload()
            second_payload = self._valid_register_payload()
            second_payload['email'] = 'hardening_user_2@example.com'
            second_payload['username'] = 'hardening_user_2'

            first = self.client.post(url, first_payload, format='json')
            second = self.client.post(url, second_payload, format='json')

            self.assertEqual(first.status_code, status.HTTP_201_CREATED)
            self.assertEqual(second.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            self.assertIn('Too many registration attempts', str(second.data.get('message', '')))

    def test_register_requires_captcha_when_enabled(self):
        url = reverse('auth-register')

        with patch('rag_api.auth_views.REQUIRE_CAPTCHA', True), patch('rag_api.auth_views.RECAPTCHA_SECRET_KEY', 'test-secret'):
            payload = self._valid_register_payload()
            response = self.client.post(url, payload, format='json')

            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertFalse(response.data.get('success', True))
            self.assertIn('CAPTCHA verification failed', str(response.data.get('message', '')))

    def test_register_succeeds_with_valid_captcha_when_enabled(self):
        url = reverse('auth-register')

        with patch('rag_api.auth_views.REQUIRE_CAPTCHA', True), patch('rag_api.auth_views.RECAPTCHA_SECRET_KEY', 'test-secret'), patch('rag_api.auth_views._verify_captcha', return_value=(True, None)):
            payload = self._valid_register_payload()
            payload['email'] = 'hardening_user_3@example.com'
            payload['username'] = 'hardening_user_3'
            payload['captcha_token'] = 'test-captcha-token'

            response = self.client.post(url, payload, format='json')

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertTrue(response.data.get('success', False))
