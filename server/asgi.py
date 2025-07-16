import os
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import aicounselor.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

django_asgi_app = get_asgi_application()

# 앱 이름으로 직접 import
from aicounselor import routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})