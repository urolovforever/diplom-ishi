import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Barcha so'rovlarni log qilish
    """
    def process_request(self, request):
        logger.info(f"{request.method} {request.path} - User: {request.user}")
        return None


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Xavfsizlik headerlarini qo'shish
    """
    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        return response