from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import Dict, Any, Optional
import requests
from dotenv import load_dotenv

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

# Langflow JSON 워크플로우 로드
def load_langflow_workflow():
    """Langflow JSON 워크플로우를 로드합니다."""
    workflow_path = os.getenv("LANGFLOW_WORKFLOW_PATH", "workflow.json")
    try:
        with open(workflow_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"워크플로우 파일을 찾을 수 없습니다: {workflow_path}")
    except json.JSONDecodeError:
        raise ValueError("잘못된 JSON 형식입니다.")

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
        
        # 워크플로우 로드
        workflow = load_langflow_workflow()
        
        # 상담가 정보 처리
        system_prompt = build_system_prompt(request.counselor_info)
        
        # OpenAI API 호출
        response = await call_openai_api(
            message=request.message,
            system_prompt=system_prompt,
            api_key=openai_api_key
        )
        
        session_id = request.session_id or f"{request.user_id}_{hash(request.message)}"
        
        return ChatResponse(
            response=response,
            session_id=session_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"예상치 못한 오류: {str(e)}")
        raise HTTPException(status_code=500, detail=f"워크플로우 실행 중 오류: {str(e)}")

def build_system_prompt(counselor_info: Optional[Dict[str, Any]]) -> str:
    """상담가 정보를 바탕으로 시스템 프롬프트를 생성합니다."""
    if not counselor_info:
        return "당신은 도움이 되는 AI 어시스턴트입니다."
    
    prompt = ""
    
    # 기본 AI 프롬프트
    if counselor_info.get('ai_prompt'):
        prompt += counselor_info['ai_prompt'] + '\n\n'
    
    # 상담가 정보 추가
    prompt += '=== 상담가 정보 ===\n'
    if counselor_info.get('name'): prompt += f"이름: {counselor_info['name']}\n"
    if counselor_info.get('age'): prompt += f"나이: {counselor_info['age']}\n"
    if counselor_info.get('gender'): prompt += f"성별: {counselor_info['gender']}\n"
    if counselor_info.get('job'): prompt += f"직업: {counselor_info['job']}\n"
    if counselor_info.get('personality'): prompt += f"성격: {counselor_info['personality']}\n"
    if counselor_info.get('speaking_style'): prompt += f"말투: {counselor_info['speaking_style']}\n"
    if counselor_info.get('feature'): prompt += f"특징: {counselor_info['feature']}\n"
    if counselor_info.get('summary'): prompt += f"요약: {counselor_info['summary']}\n"
    if counselor_info.get('specialties'): prompt += f"전문분야: {counselor_info['specialties']}\n"
    if counselor_info.get('main_age_group'): prompt += f"주요 연령대: {counselor_info['main_age_group']}\n"
    if counselor_info.get('counseling_method'): prompt += f"상담 방법: {counselor_info['counseling_method']}\n"
    if counselor_info.get('career'): prompt += f"경력: {counselor_info['career']}\n"
    if counselor_info.get('background'): prompt += f"배경: {counselor_info['background']}\n"
    if counselor_info.get('hobby'): prompt += f"취미: {counselor_info['hobby']}\n"
    
    # 최종 지시사항
    if counselor_info.get('name'):
        prompt += f'\n=== 최종 지시사항 ===\n'
        prompt += f'- 당신의 이름은 "{counselor_info["name"]}"입니다.\n'
        prompt += f'- 다른 이름으로 소개하지 마세요.\n'
        prompt += f'- 위의 상담가 정보를 정확히 따르세요.\n'
        prompt += f'- 반드시 "{counselor_info["name"]}"로 소개하세요.\n'
    
    return prompt

async def call_openai_api(message: str, system_prompt: str, api_key: str) -> str:
    """OpenAI API를 호출합니다."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message}
        ],
        "temperature": 0.2,
        "max_tokens": 1000
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        return result["choices"][0]["message"]["content"]
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API 호출 실패: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port) 