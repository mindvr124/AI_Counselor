# Langflow JSON 워크플로우 Render 배포 가이드

## 개요
이 가이드는 Langflow JSON 워크플로우를 Render.com에서 배포하는 방법을 설명합니다.

## 배포 방법 선택

### 방법 1: 백엔드만 배포 (추천)
현재 폴더에서 백엔드 API만 Render에 배포하고, 프론트엔드는 별도로 관리합니다.

### 방법 2: 전체 프로젝트 분리
프론트엔드와 백엔드를 완전히 분리하여 각각 배포합니다.

## 방법 1: 백엔드만 배포

### 사전 준비

1. **프론트엔드 파일 제외**
   - `.gitignore`에 프론트엔드 파일들이 이미 추가되어 있습니다
   - 백엔드 파일만 Git에 포함됩니다

2. **배포할 파일들**
   ```
   app.py                    # FastAPI 애플리케이션
   requirements.txt          # Python 의존성
   render.yaml              # Render 설정
   workflow.json            # Langflow 워크플로우 (직접 추가 필요)
   env.example              # 환경 변수 예시
   README_LANGFLOW.md       # 배포 가이드
   ```

### 단계별 배포

#### 1. JSON 워크플로우 파일 준비
```bash
# Langflow에서 Export한 JSON 파일을 workflow.json으로 저장
cp your-langflow-export.json workflow.json
```

#### 2. GitHub에 푸시
```bash
# 백엔드 파일들만 커밋
git add app.py requirements.txt render.yaml workflow.json
git commit -m "Add Langflow backend API"
git push origin main
```

#### 3. Render.com에서 서비스 생성

1. **Render.com 로그인**
   - https://render.com 에서 계정 생성/로그인

2. **새 Web Service 생성**
   - "New +" → "Web Service" 클릭
   - GitHub 저장소 연결

3. **서비스 설정**
   - **Name**: `langflow-json-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`

4. **환경 변수 설정**
   - `OPENAI_API_KEY`: OpenAI API 키
   - `LANGFLOW_WORKFLOW_PATH`: `workflow.json`
   - `PORT`: `$PORT` (자동 설정)

5. **배포 실행**
   - "Create Web Service" 클릭
   - 배포 완료까지 대기 (약 5-10분)

### 4. 프론트엔드 연결 설정

배포 완료 후 Render에서 제공하는 URL을 확인하고, 프론트엔드의 환경 변수를 업데이트하세요:

```bash
# 프론트엔드 .env 파일에 추가
REACT_APP_LANGFLOW_URL=https://your-app-name.onrender.com/api/v1/run
```

## 방법 2: 전체 프로젝트 분리 (선택사항)

만약 프론트엔드와 백엔드를 완전히 분리하고 싶다면:

### 백엔드 폴더 생성
```bash
mkdir langflow-backend
cd langflow-backend

# 백엔드 파일들 복사
cp ../app.py .
cp ../requirements.txt .
cp ../render.yaml .
cp ../workflow.json .
cp ../env.example .
```

### 프론트엔드 폴더 정리
```bash
# 프론트엔드 폴더에서 백엔드 파일들 제거
rm app.py requirements.txt render.yaml workflow.json env.example
```

## API 엔드포인트

- **헬스 체크**: `https://your-app-name.onrender.com/health`
- **API**: `https://your-app-name.onrender.com/api/v1/run`

## API 사용법

### 요청 예시
```json
{
  "message": "안녕하세요, 상담받고 싶습니다.",
  "user_id": "user123",
  "session_id": "session456",
  "counselor_info": {
    "name": "김상담",
    "age": "35",
    "gender": "여성",
    "job": "심리상담사",
    "personality": "따뜻하고 공감적",
    "speaking_style": "부드럽고 이해심 많음",
    "specialties": "스트레스 관리, 대인관계"
  }
}
```

### 응답 예시
```json
{
  "response": "안녕하세요! 저는 김상담입니다. 어떤 도움이 필요하신가요?",
  "session_id": "session456",
  "status": "success"
}
```

## 문제 해결

### 일반적인 문제들

1. **워크플로우 파일 오류**
   - `workflow.json` 파일이 올바른 위치에 있는지 확인
   - JSON 형식이 유효한지 확인

2. **API 키 오류**
   - Render 대시보드에서 환경 변수 확인
   - OpenAI API 키가 올바르게 설정되었는지 확인

3. **서비스 시작 실패**
   - 포트 설정 확인 (`$PORT` 사용)
   - 시작 명령어 확인

### 로그 확인
- Render 대시보드 → 서비스 → "Logs" 탭
- 실시간 로그 확인 가능

## 모니터링

### 헬스 체크
```bash
curl https://your-app-name.onrender.com/health
```

### 상태 확인
- Render 대시보드에서 서비스 상태 확인
- "Metrics" 탭에서 성능 모니터링

## 업데이트

```bash
# 코드 변경 후 GitHub에 푸시
git add .
git commit -m "Update Langflow workflow"
git push origin main

# Render에서 자동으로 재배포됨
```

## 워크플로우 수정

1. **Langflow에서 워크플로우 수정**
2. **JSON Export**
3. **GitHub에 푸시**
4. **Render 자동 재배포**

## 보안 고려사항

1. **API 키 보호**
   - 환경 변수 사용
   - GitHub에 API 키 커밋하지 않기

2. **네트워크 보안**
   - Render의 기본 HTTPS 사용
   - CORS 설정 확인

3. **접근 제어**
   - 필요시 추가 인증 구현

## 비용

- **무료 티어**: 월 750시간 (약 31일)
- **유료 플랜**: 월 $7부터 시작

## 추가 팁

1. **자동 배포**
   - GitHub에 푸시하면 자동으로 재배포됨
   - 필요시 수동 배포도 가능

2. **환경 변수 관리**
   - 민감한 정보는 Render 대시보드에서만 설정
   - 개발/프로덕션 환경 분리

3. **성능 최적화**
   - 무료 티어는 15분 비활성 후 슬립 모드
   - 첫 요청 시 약간의 지연 발생 가능

4. **워크플로우 관리**
   - 복잡한 워크플로우는 Langflow UI에서 관리
   - 간단한 워크플로우는 JSON으로 직접 수정 