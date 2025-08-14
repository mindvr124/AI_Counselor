from sqlalchemy import text
from .db_config import engine

# 사용자 존재 여부 확인 함수
def ensure_user_exists(user_id):
    check_query = text("SELECT COUNT(*) FROM public.user WHERE user_id = :user_id")
    with engine.begin() as conn:
        result = conn.execute(check_query, {"user_id": user_id})
        count = result.scalar() # 첫 번째 행의 첫 번째 컬럼 값만 반환
        print(f"사용자 ID : {user_id}")

        # 사용자가 없으면 생성
        if count == 0:
            insert_user_query = text("INSERT INTO public.user (user_id) VALUES (:user_id)")
            conn.execute(insert_user_query, {
                "user_id": user_id
            })
            print(f"새 사용자 생성: {user_id}")

# 사용자 ID로 상담 대화 저장 함수
def save_counsel_history(user_id, user_input, answer, counselor_id):
    query = text("INSERT INTO public.counsel_history (user_id, user_input, answer, counselor_id) VALUES (:user_id, :user_input, :answer, :counselor_id)")
    with engine.begin() as conn:  # 자동 commit 포함
        conn.execute(query, {
            "user_id": user_id,
            "user_input": user_input,
            "answer": answer,
            "counselor_id": counselor_id
        })