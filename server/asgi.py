import os
from django.core.asgi import get_asgi_application
from server.routing import application as websocket_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import aicounselor.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            aicounselor.routing.websocket_urlpatterns  # URL 패턴 연결
        )
    ),
})