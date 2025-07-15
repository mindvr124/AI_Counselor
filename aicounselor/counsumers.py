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
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
host = os.getenv("SERVER_HOST")
port = "3306"
database = os.getenv("DB_NAME")

# #############################################
# DB Load 함수
# #############################################
# 엔진 생성
engine = create_engine(
        f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"
    )

def load_counselor(counselor_id):
    """
    상담사 ID로 상담사 정보를 조회하는 함수
    
    Args:
        counselor_id (str): 상담사 ID
        
    Returns:
        dict: 상담사 정보가 담긴 딕셔너리 또는 None
    """
    query = text("SELECT * FROM mindvr.counselor WHERE id = :id")
    
    with engine.begin() as conn:
        result = conn.execute(query, {"id": counselor_id})
        row = result.fetchone()
        
        if row:
            # 컬럼명과 매핑하여 딕셔너리로 반환
            return {
                'id': row[0],           # id
                'name': row[1],         # name (이름)
                'gender': row[2],       # gender (성별)
                'age_group': row[3],    # age_group (나이)
                'mbti': row[4],         # mbti (성격)
                'career': row[5],       # career (경력)
                'personality': row[6],  # personality (맞춤)
                'method': row[7],       # method (전문 분야)
                'tone': row[8],         # tone (생담 방법)
                'specialty': row[9]     # specialty (특징)
            }
        else:
            return None


#----------------------------------------------
# 사용자가 존재하는지 확인하는 함수
#----------------------------------------------
def ensure_user_exists(user_id):
    check_query = text("SELECT COUNT(*) FROM user WHERE user_id = :user_id")
    with engine.begin() as conn:
        result = conn.execute(check_query, {"user_id": user_id})
        count = result.scalar() # 첫 번째 행의 첫 번째 컬럼 값만 반환
        print(f"사용자 ID : {user_id}")

        # 사용자가 없으면 생성
        if count == 0:
            insert_user_query = text("INSERT INTO user (user_id) VALUES (:user_id)")
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
        FROM counsel_summary 
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
#----------------------------------------------
# 모든 상담 내용 저장 함수
#----------------------------------------------
def save_counsel_history(user_id, user_input, answer):
    query = text("INSERT INTO counsel_history (user_id, user_input, answer) VALUES (:user_id, :user_input, :answer)")
    with engine.begin() as conn:  # 자동 commit 포함
        conn.execute(query, {
            "user_id": user_id,
            "user_input": user_input,
            "answer": answer
        })

#----------------------------------------------
# 상담 요약 내용 저장 함수
#----------------------------------------------
def save_counsel_summary(user_id, content):
    if len(content) < 30:
        return 0
    query = text("INSERT INTO counsel_summary (user_id, content) VALUES (:user_id, :content)")
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
    chat_history = []
    summary_text = ""

    async def connect(self):
        await self.accept()
        print("🔌 Django WebSocket 연결됨")

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get("type")

        # 상담사 정보 조회 요청
        if msg_type == "load_counselor":
            counselor_id = data.get("id")
            counselor_info = load_counselor(counselor_id)

            if counselor_info:
                await self.send(text_data=json.dumps({
                    "type": "load_counselor_response",
                    "status": "success",
                    "data": counselor_info
                }))
            else:
                await self.send(text_data=json.dumps({
                    "type": "load_counselor_response",
                    "status": "error",
                    "message": "해당 ID의 상담사를 찾을 수 없습니다."
                }))
            return

    async def disconnect(self, close_code):
        print("❌ 연결 종료됨")
        if self.chat_history:
            full_history = "\n".join(
                [f"사용자: {item['user']}\n상담사: {item['response']}" for item in self.chat_history]
            )
            summary_response = await self.generate_summary(self.llm, full_history, self.summary_text)
            self.summary_text = summary_response.content
            self.save_summary(self.user_id, self.summary_text)

    async def receive(self, text_data):
        data = json.loads(text_data)
        self.user_id = data["user_id"]
        user_input = data["user_input"]
        model = data["model"]
        temperature = data["temperature"]
        system = data["system"]

        ensure_user_exists(self.user_id)

        summary_data = get_counsel_summary(self.user_id)

        history = ...
        prompt_template = PromptTemplate(...)  # 기존과 동일

        callback = AsyncIteratorCallbackHandler()
        self.llm = get_streaming_llm(model, temperature, callback)
        chain = prompt_template | self.llm
        response_task = asyncio.create_task(chain.ainvoke(...))

        async for chunk in callback.aiter():
            await self.send(text_data=json.dumps({"chunk": chunk}))

        response_text = await response_task

        self.chat_history.append({
            "user": user_input,
            "response": response_text.content,
        })
        save_counsel_history(self.user_id, user_input, response_text.content)

        if len(self.chat_history) % 5 == 0:
            summary_response = await self.generate_summary(
                self.llm,
                "\n".join(
                    [f"사용자: {item['user']}\n상담사: {item['response']}" for item in self.chat_history]
                ),
                self.summary_text
            )
            self.summary_text = summary_response.content
            self.chat_history = []

        await self.send(text_data=json.dumps({"done": True}))