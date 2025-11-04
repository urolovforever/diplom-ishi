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

                # Send email (in production, use proper email backend)
                # For now, we'll just print it
                print(f"Password reset code for {email}: {code}")

                # Uncomment this in production with proper email settings
                # send_mail(
                #     'Password Reset Code',
                #     f'Your password reset code is: {code}\n\nThis code will expire in 15 minutes.',
                #     settings.DEFAULT_FROM_EMAIL,
                #     [email],
                #     fail_silently=False,
                # )

                return Response({
                    "message": "Password reset code sent to your email",
                    "code": code  # Remove this in production!
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
                return Response({
                    "error": "Reset code expired or invalid"
                }, status=status.HTTP_400_BAD_REQUEST)

            if cached_code != code:
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

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)