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
                self.user_id = user_id
                user_input = data.get("message")
                model = data.get("apiSettings", {}).get("model", "gpt-4o")
                temperature = data.get("apiSettings", {}).get("temperature", 0.2)
                system_prompt = data.get("systemPrompt", "")
                message_history = data.get("messageHistory", [])
                print("신규 사용자 여부를 확인합니다.",self.user_id)
                ensure_user_exists(self.user_id)
                
                # 메시지 시작 알림
                await self.send(text_data=json.dumps({"type": "message_start"}))
                
                # 이전 요약 가져오기
                summary_data = get_counsel_summary(self.user_id)
                print(f"지난 상담 요약 내용 : {summary_data}")
                
                # 현재 세션의 실시간 요약과 최근 대화 구성
                if self.summary_text:
                    # 실시간 요약이 있는 경우: 요약 + 최근 5턴
                    recent_history = "\n".join(
                        [f"사용자: {item['user']}\n상담가: {item['response']}" for item in self.chat_history[-5:]]
                    )
                    current_session_history = f"요약된 대화: {self.summary_text}\n\n최근 대화:\n{recent_history}"
                else:
                    # 실시간 요약이 없는 경우: 전체 chat_history 사용
                    current_session_history = "\n".join(
                        [f"사용자: {item['user']}\n상담가: {item['response']}" for item in self.chat_history]
                    )
                
                # 상담가 정보 문자열 구성
                counselor_profile = ""
                if self.counselor_info:
                    counselor_profile = f"""
            상담가 정보:
            - 이름: {self.counselor_info.get('name')}
            - 성별: {self.counselor_info.get('gender')}
            - 나이: {self.counselor_info.get('age')}
            - 직업: {self.counselor_info.get('job')}
            - 경력: {self.counselor_info.get('career')}
            - 전문 분야: {self.counselor_info.get('specialty')}
            - 주요 상담 연령대: {self.counselor_info.get('client_age_focus')}
            - 성격: {self.counselor_info.get('personality')}
            - 말투: {self.counselor_info.get('tone')}
            - 특징: {self.counselor_info.get('feature')}
            - 상담 방법: {self.counselor_info.get('method')}
            - 배경 이야기: {self.counselor_info.get('backstroy')}
            - 취미: {self.counselor_info.get('hobby')}
            - 한 줄 소개: {self.counselor_info.get('short_intro')}
            """

                # 지난 상담 요약이 있는 경우와 없는 경우를 구분하여 프롬프트 구성
                if summary_data:
                    # 지난 상담 요약이 있는 경우
                    prompt_template = PromptTemplate(
                        input_variables=["counselor_profile", "system_prompt", "summary_data", "current_session_history", "user_input"],
                        template="""
            {counselor_profile}

            시스템 지침:
            {system_prompt}

            '현재 세션 대화'는 실시간 요약중인 대화입니다. 인사를 하지 말고 대화를 이어나가주세요.
            '지난 상담 대화'는 지난 상담 요약 내용입니다. 어떤 변화가 있었는지 물어보며 대화를 이어나가주세요.

            지난 상담 대화:
            {summary_data}

            현재 세션 대화:
            {current_session_history}

            사용자: {user_input}

            위의 상담가 정보를 바탕으로 해당 상담가의 정보를 모두 반영하여 응답하세요.
            상담가 고유 프롬프트와 시스템 지침을 준수하고, 지난 상담 요약과 현재 세션 대화의 맥락을 이어가세요.

            상담가:
            """
                    )
                    
                    prompt_vars = {
                        "counselor_profile": counselor_profile,
                        "system_prompt": system_prompt,
                        "summary_data": summary_data,
                        "current_session_history": current_session_history if current_session_history else "대화 시작",
                        "user_input": user_input
                    }
                else:
                    # 첫 상담인 사용자
                    prompt_template = PromptTemplate(
                        input_variables=["counselor_profile", "system_prompt", "current_session_history", "user_input"],
                        template="""
            {counselor_profile}

            시스템 지침:
            {system_prompt}

            '현재 세션 대화'는 실시간 요약중인 대화입니다. 인사를 하지 말고 대화를 이어나가주세요.

            현재 세션 대화:
            {current_session_history}

            사용자: {user_input}

            위의 상담가 정보를 바탕으로 해당 상담가의 정보를 모두 반영하여 응답하세요.
            상담가 고유 프롬프트와 시스템 지침을 준수하고, 현재 세션 대화의 맥락을 이어가세요.

            상담가:
            """
                    )
                    
                    prompt_vars = {
                        "counselor_profile": counselor_profile,
                        "system_prompt": system_prompt,
                        "current_session_history": current_session_history if current_session_history else "대화 시작",
                        "user_input": user_input
                    }
                
                # 스트리밍 콜백 생성
                callback = AsyncIteratorCallbackHandler()
                self.llm = get_streaming_llm(model, temperature, callback)
                chain = prompt_template | self.llm
                
                # 응답 생성 태스크 시작
                response_task = asyncio.create_task(chain.ainvoke(prompt_vars))
                
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
                load_counselor_id = self.counselor_info.get('id')
                
                # 대화 기록 저장 (chat_history와 DB 모두)
                self.chat_history.append({
                    "user": user_input,
                    "response": response_text.content,
                })
                save_counsel_history(self.user_id, user_input, response_text.content, load_counselor_id)
                
                # 5개 메시지마다 요약 생성
                if len(self.chat_history) % 5 == 0:
                    full_history = "\n".join(
                        [f"사용자: {item['user']}\n상담가: {item['response']}" for item in self.chat_history]
                    )
                    summary_response = await generate_summary(
                        self.llm,
                        full_history,
                        self.summary_text
                    )
                    self.summary_text = summary_response.content
                    print("📝 요약 업데이트:", self.summary_text)
                    self.chat_history = []  # 요약 후 chat_history 초기화
                
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