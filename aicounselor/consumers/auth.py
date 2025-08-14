# WebSocket 인증 로직 (JWT 토큰)
import jwt
import os

# 비밀 키는 .env 또는 설정에서 가져오는 게 좋음
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")

def validate_user(token: str):
    """
    JWT 토큰을 검증하고 user_id 반환
    유효하지 않으면 None 반환
    """
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = decoded.get("user_id")
        return user_id
    except jwt.ExpiredSignatureError:
        print("❌ 토큰 만료")
    except jwt.InvalidTokenError:
        print("❌ 유효하지 않은 토큰")
    return None
