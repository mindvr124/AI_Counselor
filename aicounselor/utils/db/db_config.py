import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# .env 파일 로드
load_dotenv()

# DATABASE_URL 환경변수에서 DB 연결 정보 가져오기
db_url = os.getenv("DATABASE_URL")

# SQLAlchemy 엔진 생성 / pool_pre_ping : 연결이 끊어진 경우 자동으로 재시도해주는 안정성 옵션
engine = create_engine(db_url, pool_pre_ping=True)