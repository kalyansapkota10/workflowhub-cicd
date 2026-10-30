from .models import Task
from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()

class AuthenticationAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="Password2026"
        )

    def test_user_registration(self):
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "TestPassword2026"
        }

        response = self.client.post(
            reverse("register"),
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        user = User.objects.get(username="newuser")

        self.assertTrue(
            user.check_password(data["password"])
        )

        self.assertNotIn("password", response.data)

    def test_duplicate_email_registration(self):
        data = {
            "username": "anotheruser",
            "email": "existing@example.com",
            "password": "TestPassword2026"
        }

        response = self.client.post(
            reverse("register"),
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

    def test_successful_login(self):
        data = {
            "username": "existinguser",
            "password": "Password2026"
        }

        response = self.client.post(
            reverse("login"),
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertIn("token", response.data)

    def test_invalid_login(self):
        data = {
            "username": "existinguser",
            "password": "WrongPassword"
        }

        response = self.client.post(
            reverse("login"),
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_successful_logout(self):
        token = Token.objects.create(user=self.user)

        self.client.credentials(
            HTTP_AUTHORIZATION = f"Token {token.key}"
        )

        response = self.client.post(
            reverse("logout"),
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertFalse(
            Token.objects.filter(key=token.key).exists()
        )

        second_response = self.client.post(
            reverse("logout"),
            format="json"
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_logout_without_authentication(self):
        response = self.client.post(
            reverse("logout"),
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )


class TaskCreationAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="taskowner",
            email="taskowner@example.com",
            password="StrongDummyPassword!2026"
        )

        self.other_user = User.objects.create_user(
            username="anotheruser",
            email="another@example.com",
            password="AnotherDummyPassword!2026"
        )

        self.token = Token.objects.create(user=self.user)

        self.url = reverse("task-list-create")

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

    def test_authenticated_user_can_create_task(self):
        data = {
            "title": "Complete SOFT806 Assignment",
            "description": "Prepare the CI/CD assignment.",
            "due_date": "2026-11-05"
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        task = Task.objects.get(id=response.data["id"])

        self.assertEqual(task.owner, self.user)
        self.assertEqual(task.title, data["title"])
        self.assertEqual(task.status, Task.Status.TO_DO)

    def test_task_requires_title(self):
        data = {
            "description": "Task without a title."
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(Task.objects.count(), 0)

    def test_user_cannot_assign_task_to_another_user(self):
        data = {
            "title": "My Task",
            "owner": self.other_user.id
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        task = Task.objects.get(id=response.data["id"])

        self.assertEqual(task.owner, self.user)
        self.assertNotEqual(task.owner, self.other_user)

    def test_unauthenticated_user_cannot_create_task(self):
        self.client.credentials()

        data = {
            "title": "Unauthorized Task"
        }

        response = self.client.post(
            self.url,
            data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

        self.assertEqual(Task.objects.count(), 0)


class TaskViewingAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="taskviewer",
            email="taskviewer@example.com",
            password="DummyPassword!2026"
        )

        self.other_user = User.objects.create_user(
            username="otherviewer",
            email="otherviewer@example.com",
            password="AnotherDummyPassword!2026"
        )

        self.token = Token.objects.create(user=self.user)

        self.url = reverse("task-list-create")

        self.task1 = Task.objects.create(
            owner=self.user,
            title="My First Task",
            description="Complete the assignment."
        )

        self.task2 = Task.objects.create(
            owner=self.user,
            title="My Second Task",
            status=Task.Status.IN_PROGRESS
        )

        self.other_task = Task.objects.create(
            owner=self.other_user,
            title="Another User's Private Task"
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {self.token.key}"
        )

    def test_authenticated_user_can_view_tasks(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(len(response.data), 2)

        titles = [task["title"] for task in response.data]

        self.assertIn("My First Task", titles)
        self.assertIn("My Second Task", titles)

    def test_user_cannot_view_other_users_tasks(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        task_ids = [task["id"] for task in response.data]

        self.assertNotIn(self.other_task.id, task_ids)

        for task in response.data:
            self.assertEqual(task["owner"], self.user.id)

    def test_unauthenticated_user_cannot_view_tasks(self):
        self.client.credentials()

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_user_without_tasks_receives_empty_list(self):
        new_user = User.objects.create_user(
            username="emptyuser",
            email="emptyuser@example.com",
            password="StrongDummyPassword!2026"
        )

        new_token = Token.objects.create(user=new_user)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Token {new_token.key}"
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(response.data, [])