from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv
from langflow import load_flow_from_json
from langflow.schema import Message

load_dotenv()

app = FastAPI(title="Langflow API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Langflow 워크플로우 인스턴스
langflow_flow = None

def load_langflow_workflow():
    """Langflow JSON 워크플로우를 로드하고 실행 가능한 플로우로 변환합니다."""
    global langflow_flow
    workflow_path = os.getenv("LANGFLOW_WORKFLOW_PATH", "workflow.json")
    try:
        with open(workflow_path, 'r', encoding='utf-8') as f:
            workflow_data = json.load(f)
        
        # Langflow 플로우 로드
        langflow_flow = load_flow_from_json(workflow_data)
        return langflow_flow
    except FileNotFoundError:
        raise FileNotFoundError(f"워크플로우 파일을 찾을 수 없습니다: {workflow_path}")
    except json.JSONDecodeError:
        raise ValueError("잘못된 JSON 형식입니다.")
    except Exception as e:
        raise Exception(f"Langflow 워크플로우 로드 실패: {str(e)}")

# 요청 모델
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "anonymous"
    session_id: Optional[str] = None
    counselor_info: Optional[Dict[str, Any]] = None
    
    class Config:
        # 추가 필드 허용
        extra = "allow"

class ChatResponse(BaseModel):
    response: str
    session_id: str
    status: str = "success"

@app.get("/")
async def root():
    return {"message": "Langflow API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "langflow-api"}

@app.post("/api/v1/debug")
async def debug_request(request: dict):
    """디버깅용 엔드포인트 - 받은 요청 데이터를 그대로 반환"""
    return {
        "received_data": request,
        "message": "디버그 요청이 성공적으로 처리되었습니다."
    }

@app.post("/api/v1/run", response_model=ChatResponse)
async def run_langflow_workflow(request: ChatRequest):
    """
    Langflow JSON 워크플로우를 실행합니다.
    """
    try:
        # 요청 데이터 검증 및 로깅
        print(f"받은 요청 데이터: {request}")
        print(f"메시지: {request.message}")
        print(f"사용자 ID: {request.user_id}")
        print(f"세션 ID: {request.session_id}")
        print(f"상담가 정보: {request.counselor_info}")
        
        # 메시지 검증
        if not request.message or request.message.strip() == "":
            raise HTTPException(status_code=422, detail="메시지가 비어있습니다.")
        
        # OpenAI API 키 확인
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise HTTPException(status_code=500, detail="OpenAI API 키가 설정되지 않았습니다.")
        
        # Langflow 워크플로우 로드 (한 번만)
        global langflow_flow
        if langflow_flow is None:
            langflow_flow = load_langflow_workflow()
        
        # 세션 ID 설정
        session_id = request.session_id or f"{request.user_id}_{hash(request.message)}"
        
        # Langflow 메시지 생성
        langflow_message = Message(
            text=request.message,
            session_id=session_id,
            sender="user"
        )
        
        # 상담가 정보를 메시지 속성에 추가
        if request.counselor_info:
            langflow_message.properties = {
                "counselor_info": request.counselor_info
            }
        
        # Langflow 워크플로우 실행
        print(f"Langflow 워크플로우 실행 중... 세션 ID: {session_id}")
        result = await langflow_flow.arun(
            message=langflow_message,
            session_id=session_id
        )
        
        # 결과에서 응답 추출
        if hasattr(result, 'text'):
            response_text = result.text
        elif isinstance(result, dict) and 'text' in result:
            response_text = result['text']
        elif isinstance(result, str):
            response_text = result
        else:
            response_text = str(result)
        
        print(f"Langflow 응답: {response_text}")
        
        return ChatResponse(
            response=response_text,
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Langflow 워크플로우 실행 중 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"워크플로우 실행 중 오류: {str(e)}")

# Langflow 워크플로우 초기화 함수
def initialize_langflow():
    """애플리케이션 시작 시 Langflow 워크플로우를 초기화합니다."""
    try:
        global langflow_flow
        langflow_flow = load_langflow_workflow()
        print("Langflow 워크플로우가 성공적으로 로드되었습니다.")
    except Exception as e:
        print(f"Langflow 워크플로우 초기화 실패: {str(e)}")
        raise e

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    
    # Langflow 워크플로우 초기화
    try:
        initialize_langflow()
    except Exception as e:
        print(f"Langflow 초기화 실패: {str(e)}")
        print("애플리케이션을 시작할 수 없습니다.")
        exit(1)
    
    uvicorn.run(app, host="0.0.0.0", port=port) 