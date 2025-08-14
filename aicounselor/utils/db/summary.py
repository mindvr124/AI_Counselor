from sqlalchemy import text
from .db_config import engine

# 상담 요약 내용 저장 함수
def save_counsel_summary(user_id, content):
    if len(content) < 30:
        return 0
    try:
        query = text("INSERT INTO public.counsel_summary (user_id, content) VALUES (:user_id, :content)")
        with engine.begin() as conn:
            conn.execute(query, {
                "user_id": user_id,
                "content": content
            })
    except Exception as e:
        print(f"❌ 요약 저장 중 오류 발생: {e}")

# 지난 상담 요약 내용 조회
def get_counsel_summary(user_id):
    query = text("""
        SELECT content 
        FROM public.counsel_summary 
        WHERE user_id = :user_id 
        ORDER BY id DESC 
        LIMIT 1
    """)
    with engine.begin() as conn:
        result = conn.execute(query, {"user_id": user_id})
        row = result.fetchone()
        return row[0] if row else None