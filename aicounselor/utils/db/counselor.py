from sqlalchemy import text
from .db_config import engine

# AI 심리 상담가 정보 조회 함수
def load_counselor(counselor_id):
    """
    상담가 ID로 상담가 정보를 조회하는 함수
    """
    query = text("SELECT * FROM public.counselor WHERE id = :id")

    with engine.begin() as conn:
        result = conn.execute(query, {"id": counselor_id})
        row = result.fetchone()

        if row:
            # SQLAlchemy Row 객체를 dict로 변환 (컬럼명 기준 매핑)
            return dict(row._mapping)
        else:
            return None

# AI 심리 상담가 정보 저장 함수
def save_counselor(counselor_data):
    try:
        # 디버깅: 저장하려는 데이터 출력
        print(f"저장하려는 데이터: {counselor_data}")
        print(f"short_intro: {counselor_data.get('short_intro', 'NOT_FOUND')}")
        print(f"client_age_focus: {counselor_data.get('client_age_focus', 'NOT_FOUND')}")
        
        exist = load_counselor(counselor_data['id'])
        
        if exist:
            query = text("""
                UPDATE public.counselor
                SET 
                    name = :name,
                    age = :age,
                    gender = :gender,
                    job = :job,
                    personality = :personality,
                    tone = :tone,
                    feature = :feature,
                    short_intro = :short_intro,
                    specialty = :specialty,
                    client_age_focus = :client_age_focus,
                    method = :method,
                    career = :career,
                    backstory = :backstory,
                    hobby = :hobby,                
                    prompt = :prompt
                WHERE id = :id
            """)
        else:
            query = text("""
                INSERT INTO public.counselor (
                    id, name, age, gender, job, personality, tone, feature, short_intro, specialty, client_age_focus, method, career, backstory, hobby, prompt
                ) VALUES (
                    :id, :name, :age, :gender, :job, :personality, :tone, :feature, :short_intro, :specialty, :client_age_focus, :method, :career, :backstory, :hobby, :prompt
                )
            """)

        with engine.begin() as conn:
            result = conn.execute(query, {
                "id": counselor_data['id'],
                "name": counselor_data.get('name', ''),
                "age": counselor_data.get('age', ''),
                "gender": counselor_data.get('gender', ''),
                "job": counselor_data.get('job', ''),
                "personality": counselor_data.get('personality', ''),                   
                "tone": counselor_data.get('tone', ''),
                "feature": counselor_data.get('feature', ''),
                "short_intro": counselor_data.get('short_intro', ''),
                "specialty": counselor_data.get('specialty', ''),
                "client_age_focus": counselor_data.get('client_age_focus', ''),
                "method": counselor_data.get('method', ''),
                "career": counselor_data.get('career', ''),
                "backstory": counselor_data.get('backstory', ''),
                "hobby": counselor_data.get('hobby', ''),                     
                "prompt": counselor_data.get('prompt', '')             
            })

        return {
            'success': True,
            'message': '상담가 정보가 성공적으로 저장되었습니다.',
            'counselor_id': counselor_data['id'],
            'affected_rows': result.rowcount
        }

    except Exception as e:
        return {
            'success': False,
            'message': f'상담가 정보 저장 중 오류가 발생했습니다: {str(e)}',
            'error': str(e)
        }