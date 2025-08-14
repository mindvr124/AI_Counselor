# 기존 ChatConsumer 분리counselorInfoload_counselor
# WebSocket 관련 클래스/헬퍼
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio

from aicounselor.utils.state import ChatState
from aicounselor.utils.llm.get_llm import get_streaming_llm
from aicounselor.utils.llm.summary import generate_summary
from aicounselor.graph.chat_graph import build_chat_graph
from aicounselor.utils.db.counselor import load_counselor
from aicounselor.utils.db.user import ensure_user_exists
from aicounselor.utils.db.summary import save_counsel_summary
from aicounselor.consumers.utils import send_json


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.callback = AsyncIteratorCallbackHandler()
        self.llm = None

    async def connect(self):
        self.user_id = None
        self.chat_history = []
        await self.accept()
        print("🔌 WebSocket 연결됨")

    async def disconnect(self, close_code):
        print("❌ WebSocket 연결 종료")
        if self.chat_history and self.user_id:
            full_history = "\n".join(
                [f"사용자: {item['user']}\n상담가: {item['response']}" for item in self.chat_history]
            )
            summary_response = await generate_summary(self.llm, full_history, self.summary_text)
            save_counsel_summary(self.user_id, summary_response.content)
            await send_json(self, "session_end", "요약이 저장되었습니다.")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            msg_type = data.get("type")
            
            # 상담가 정보 로드
            if msg_type == "load_counselor":
                counselor_id = data.get("id")
                counselor_info = load_counselor(counselor_id)
                if counselor_info is not None:
                    self.counselor_info = counselor_info
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
            
            # 메시지 전송
            if msg_type == "send_message":
                user_id = data["user_id"]
                user_input = data["message"]
                model = data["apiSettings"]["model"]
                temperature = data["apiSettings"]["temperature"]
                system_prompt = data.get("systemPrompt", "")
                counselor_id = data.get("counselor_id")

                # 신규 사용자 여부 확인
                ensure_user_exists(user_id)

                # LLM + Callback 연결
                self.llm = get_streaming_llm(model, temperature, self.callback)

                # 초기 상태 구성
                state: ChatState = {
                    "user_id": user_id,
                    "user_input": user_input,
                    "counselor_id": counselor_id,
                    "system_prompt": system_prompt,
                    "llm": self.llm,
                    "callback": self.callback,
                    "chat_history": [],
                    "turn_count": 0,
                    "summary_text": "",
                }
                
                try:
                    # 그래프 실행
                    chat_graph = build_chat_graph()
                    print("💬 [ainvoke 전] 초기 상태:", state)

                    # 백그라운드로 실행 시작
                    ainvoke_task = asyncio.create_task(chat_graph.ainvoke(state))

                    try:
                        # 5초 내 완료되면 바로 결과 사용
                        final_state = await asyncio.wait_for(ainvoke_task, timeout=5)
                    except asyncio.TimeoutError:
                        # 5초 초과 시 즉시 진행 중 콜백 전송 후, 완료까지 대기
                        await send_json(self, "processing", {"message": "응답 생성 중입니다."})
                        final_state = await ainvoke_task

                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning("🔥 evaluate_response_node 진입했음!")

                    if final_state.get("retry") is False and final_state.get("stream_callback"):
                        async for chunk in final_state["stream_callback"].aiter():
                            await send_json(self, "message_chunk", chunk)

                    await send_json(self, "message_end")

                except Exception as e:
                    import traceback
                    traceback.print_exc()
                    print("그래프 실행 중 에러:",e)
                
                

        except Exception as e:
            await self.send(text_data=json.dumps({
                "type": "error",
                "message": str(e)
            }))