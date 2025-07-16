import json, os, asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from sqlalchemy import create_engine, text
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# #############################################
# DB 연결 설정
# #############################################
# user = os.getenv("DB_USER")
# password = os.getenv("DB_PASSWORD")
# host = os.getenv("SERVER_HOST")
# port = "3306"
# database = os.getenv("DB_NAME")

# PostgreSQL용 환경 변수 가져오기 (Render에서 제공한 DATABASE_URL 사용)
db_url = os.getenv("DATABASE_URL")

# SQLAlchemy 엔진 생성
engine = create_engine(db_url)

# #############################################
# DB Load 함수
# #############################################
# 엔진 생성
# engine = create_engine(
#         f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"
#     )
engine = create_engine(db_url)

def load_counselor(counselor_id):
    """
    상담가 ID로 상담가 정보를 조회하는 함수
    
    Args:
        counselor_id (str): 상담가 ID
        
    Returns:
        dict: 상담가 정보가 담긴 딕셔너리 또는 None
    """
    query = text("SELECT * FROM public.counselor WHERE id = :id")
    
    with engine.begin() as conn:
        result = conn.execute(query, {"id": counselor_id})
        row = result.fetchone()

        if row:
            # 컬럼명과 매핑하여 딕셔너리로 반환
            return {
                'id': row[0],           
                'name': row[1],         
                'gender': row[2],       
                'age': row[3],          
                'mbti': row[4],         
                'career': row[5],       
                'personality': row[6],
                'method': row[7],       
                'tone': row[8],         
                'specialty': row[9],    
                'prompt': row[10],      
            }
        else:
            return None


#----------------------------------------------
# 사용자가 존재하는지 확인하는 함수
#----------------------------------------------
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

#----------------------------------------------
# 지난 상담 요약 내용 조회
#----------------------------------------------
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
    
# #############################################
# 요약 생성 함수
# #############################################
def generate_summary(llm, history, summary_text):
    summary_template = PromptTemplate(
        input_variables=["history", "summary_text"],
        template="""
        이전 요약 대화:
        {summary_text}

        -----------------
        다음은 현재 진행중인 상담의 대화 기록입니다. 
        사용자의 이름, 상담 이유와 그에 관련된 핵심 내용을 중복이 없도록 요약해 주세요.
        이전 요약 대화에서 중요한 내용은 삭제하지 말고 덧붙여서 요약해주세요.

        무의미한 대화나 인사만 있는 경우 요약하지 말고 받은 데이터를 그대로 보내주세요.
        -----------------

        실시간 대화:
        {history}
        """
    )
    summary_chain = summary_template | llm
    return summary_chain.ainvoke({
        "summary_text": summary_text,
        "history": history
    })
    
# #############################################
# DB Save 함수
# #############################################
def save_counselor(counselor_data):
    """
    상담가 정보를 저장하는 함수

    Args:
        counselor_data (dict): 상담가 정보가 담긴 딕셔너리

    Returns:
        dict: 저장 결과 정보가 담긴 딕셔너리 또는 Fail
    """
    try:
        exist = load_counselor(counselor_data['id'])
        
        if exist:
            # UPDATE 쿼리 - 필드 매핑 수정
            query = text("""
                UPDATE public.counselor
                SET 
                    name = :name,
                    gender = :gender,
                    age = :age,
                    mbti = :mbti,
                    career = :career,
                    personality = :personality,
                    method = :method,
                    tone = :tone,
                    specialty = :specialty,
                    prompt = :prompt
                WHERE id = :id
            """)
        else:
            # INSERT 쿼리 - 필드 매핑 수정
            query = text("""
                INSERT INTO public.counselor (
                    id, name, gender, age, mbti, career, personality, method, tone, specialty, prompt
                ) VALUES (
                    :id, :name, :gender, :age, :mbti, :career, :personality, :method, :tone, :specialty, :prompt
                )
            """)

        with engine.begin() as conn:
            result = conn.execute(query, {
                "id": counselor_data['id'],
                "name": counselor_data['name'],
                "gender": counselor_data['gender'],
                "age": counselor_data['age'],      # 정확한 필드명
                "mbti": counselor_data['mbti'],                # 정확한 필드명
                "career": counselor_data['career'],
                "personality": counselor_data['personality'],  # 정확한 필드명
                "method": counselor_data['method'],
                "tone": counselor_data['tone'],                # 정확한 필드명
                "specialty": counselor_data['specialty'],      # 정확한 필드명
                "prompt": counselor_data['prompt']             # 프롬프트 필드
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


#----------------------------------------------
# 모든 상담 내용 저장 함수
#----------------------------------------------
def save_counsel_history(user_id, user_input, answer, counselor_id):
    query = text("INSERT INTO public.counsel_history (user_id, user_input, answer, counselor_id) VALUES (:user_id, :user_input, :answer, :counselor_id)")
    with engine.begin() as conn:  # 자동 commit 포함
        conn.execute(query, {
            "user_id": user_id,
            "user_input": user_input,
            "answer": answer,
            "counselor_id": counselor_id
        })

#----------------------------------------------
# 상담 요약 내용 저장 함수
#----------------------------------------------
def save_counsel_summary(user_id, content):
    if len(content) < 30:
        return 0
    query = text("INSERT INTO public.counsel_summary (user_id, content) VALUES (:user_id, :content)")
    with engine.begin() as conn:
        conn.execute(query, {
            "user_id": user_id,
            "content": content
        })


# #############################################
# 스트리밍 모델 생성 함수
# #############################################
def get_streaming_llm(model, temperature, callback):
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        streaming=True,
        callbacks=[callback],
        openai_api_key=OPENAI_API_KEY
    )

class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.chat_history = []
        self.summary_text = ""
        self.user_id = None
        self.llm = None
        self.counselor_info = None  # 상담가 정보 저장

    async def connect(self):
        await self.accept()
        print("🔌 Django WebSocket 연결됨")

    async def disconnect(self, close_code):
        print("❌ 연결 종료됨")
        if self.chat_history and self.user_id:
            full_history = "\n".join(
                [f"사용자: {item['user']}\n상담가: {item['response']}" for item in self.chat_history]
            )
            if self.llm:
                summary_response = await generate_summary(self.llm, full_history, self.summary_text)
                self.summary_text = summary_response.content
                save_counsel_summary(self.user_id, self.summary_text)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get("type")
            print(f"📨 수신된 메시지 타입: {msg_type}")

            # 상담가 정보 조회 요청
            if msg_type == "load_counselor":
                counselor_id = data.get("id")
                print(f"🔍 조회할 상담가 ID: {counselor_id}")
                
                counselor_info = load_counselor(counselor_id)
                print(f"📋 조회 결과: {counselor_info}")
                print(f"📋 결과 타입: {type(counselor_info)}")
                
                if counselor_info is not None:  # 더 명확한 None 체크
                    self.counselor_info = counselor_info  # 상담가 정보 저장
                    print("✅ 상담가 정보 전송")
                    await self.send(text_data=json.dumps({
                        "type": "counselor_info",
                        "payload": counselor_info
                    }))
                else:
                    print("❌ 상담가 정보 없음 - 에러 전송")
                    await self.send(text_data=json.dumps({
                        "type": "error",
                        "message": "해당 ID의 상담를 찾을 수 없습니다."
                    }))
                return

            # 메시지 전송 처리
            elif msg_type == "send_message":
                user_id = data.get("user_id")
                user_input = data.get("message")
                model = data.get("apiSettings", {}).get("model", "gpt-4o")
                temperature = data.get("apiSettings", {}).get("temperature", 0.2)
                system_prompt = data.get("systemPrompt", "")
                message_history = data.get("messageHistory", [])
                
                ensure_user_exists(user_id)
                
                # 메시지 시작 알림
                await self.send(text_data=json.dumps({"type": "message_start"}))
                
                # 이전 요약 가져오기
                summary_data = get_counsel_summary(user_id)
                
                # 대화 기록 구성
                history = ""
                for msg in message_history[-5:]:  # 최근 5개 메시지만
                    if msg['type'] == 'user':
                        history += f"사용자: {msg['content']}\n"
                    elif msg['type'] == 'ai':
                        history += f"상담가: {msg['content']}\n"
                
                # 상담가 정보 문자열 구성
                counselor_profile = ""
                if self.counselor_info:
                    counselor_profile = f"""
상담가 정보:
- 이름: {self.counselor_info.get('name')}
- 성별: {self.counselor_info.get('gender')}
- 연령대: {self.counselor_info.get('age')}
- MBTI: {self.counselor_info.get('mbti')}
- 경력: {self.counselor_info.get('career')}
- 성격: {self.counselor_info.get('personality')}
- 상담 방법: {self.counselor_info.get('method')}
- 상담 톤: {self.counselor_info.get('tone')}
- 전문 분야: {self.counselor_info.get('specialty')}
"""

                # 프롬프트 템플릿 구성
                prompt_template = PromptTemplate(
                    input_variables=["counselor_profile", "system_prompt", "summary_memory", "recent_history", "user_input"],
                    template="""
{counselor_profile}

시스템 지침:
{system_prompt}

=== 요약 메모리 (이전 상담 세션들의 요약) ===
{summary_memory}

=== 최근 대화 히스토리 ===
{recent_history}

사용자: {user_input}

위의 상담가 정보를 바탕으로 해당 상담가의 성격, 경력, MBTI, 상담 방법, 톤, 전문 분야를 모두 반영하여 응답하세요.
상담가 고유 프롬프트와 시스템 지침을 준수하고, 요약 메모리의 내용을 참고하여 일관성 있는 상담을 제공하며, 최근 대화의 맥락을 이어가세요.

상담가:
"""
                )
                
                # 스트리밍 콜백 생성
                callback = AsyncIteratorCallbackHandler()
                self.llm = get_streaming_llm(model, temperature, callback)
                chain = prompt_template | self.llm
                
                # 응답 생성 태스크 시작
                response_task = asyncio.create_task(chain.ainvoke({
                    "counselor_profile": counselor_profile,
                    "system_prompt": system_prompt,
                    "summary_memory": summary_data or "이전 상담 기록이 없습니다.",
                    "recent_history": history if history else "대화 시작",
                    "user_input": user_input
                }))
                
                # 스트리밍 응답 전송
                full_response = ""
                async for chunk in callback.aiter():
                    await self.send(text_data=json.dumps({
                        "type": "message_chunk",
                        "content": chunk
                    }))
                    full_response += chunk
                
                # 응답 완료 대기
                response_text = await response_task
                
                # 메시지 종료 알림
                await self.send(text_data=json.dumps({"type": "message_end"}))
                
                # 대화 기록 저장
                self.chat_history.append({
                    "user": user_input,
                    "response": response_text.content,
                })
                save_counsel_history(self.user_id, user_input, response_text.content, self.counselor_info.id)
                
                # 5개 메시지마다 요약 생성
                if len(self.chat_history) % 5 == 0:
                    summary_response = await generate_summary(
                        self.llm,
                        "\n".join(
                            [f"사용자: {item['user']}\n상담가: {item['response']}" for item in self.chat_history]
                        ),
                        self.summary_text
                    )
                    self.summary_text = summary_response.content
                    self.chat_history = []
                
                return

            # 상담가 정보 저장 요청
            elif msg_type == "save_counselor":
                counselor_data = data.get("data", {})
                result = save_counselor(counselor_data)
                if result["success"]:
                    await self.send(text_data=json.dumps({
                        "type": "save_success" if result["success"] else "save_error",
                        "message": result["message"]
                    }))
                else:
                    await self.send(text_data=json.dumps({
                        "type": "save_error",
                        "message": result["message"]
                    }))
                return

        except Exception as e:
            print(f"❌ 에러 발생: {e}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": str(e)
            }))