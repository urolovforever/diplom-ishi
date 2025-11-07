from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from urllib.parse import parse_qs

User = get_user_model()


@database_sync_to_async
def get_user_from_token(token_key):
    """Get user from JWT token"""
    try:
        # Validate token
        UntypedToken(token_key)

        # Decode token
        decoded_data = jwt_decode(
            token_key,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )

        # Get user ID from token
        user_id = decoded_data.get('user_id')

        if user_id:
            user = User.objects.get(id=user_id)
            return user

    except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
        pass

    return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens.
    The token can be passed as a query parameter: ws://host/path?token=<jwt_token>
    """

    async def __call__(self, scope, receive, send):
        # Get query string from scope
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)

        # Extract token from query parameters
        token_key = query_params.get('token', [None])[0]

        if token_key:
            # Get user from token
            scope['user'] = await get_user_from_token(token_key)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)
