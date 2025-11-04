from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
import random
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)

        print(f"Change password validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']

            try:
                user = User.objects.get(email=email)

                # Generate 6-digit code
                code = str(random.randint(100000, 999999))

                # Store code in cache for 15 minutes
                cache.set(f'password_reset_{email}', code, 60 * 15)

                # Send email with reset code
                try:
                    send_mail(
                        'Password Reset Code',
                        f'Your password reset code is: {code}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this code, please ignore this email.',
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                except Exception as e:
                    print(f"Error sending email: {e}")

                return Response({
                    "message": "Password reset code sent to your email"
                }, status=status.HTTP_200_OK)

            except User.DoesNotExist:
                # Don't reveal if email exists or not
                return Response({
                    "message": "If this email exists, you will receive a reset code"
                }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            new_password = serializer.validated_data['new_password']

            # Check if code matches
            cached_code = cache.get(f'password_reset_{email}')

            if not cached_code:
                print(f"Reset code expired for {email}")
                return Response({
                    "error": "Reset code expired or invalid"
                }, status=status.HTTP_400_BAD_REQUEST)

            if cached_code != code:
                print(f"Invalid reset code for {email}. Expected: {cached_code}, Got: {code}")
                return Response({
                    "error": "Invalid reset code"
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = User.objects.get(email=email)
                user.set_password(new_password)
                user.save()

                # Delete the code
                cache.delete(f'password_reset_{email}')

                return Response({
                    "message": "Password reset successfully"
                }, status=status.HTTP_200_OK)

            except User.DoesNotExist:
                return Response({
                    "error": "User not found"
                }, status=status.HTTP_400_BAD_REQUEST)

        print(f"Password reset confirm validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)