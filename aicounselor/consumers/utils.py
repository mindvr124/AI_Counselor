# 공통 WebSockt 메시지 포맷, 예외처리 등
import json

async def send_json(socket, data_type, payload=None):
    if payload is None:
        await socket.send(text_data=json.dumps({
            "type": data_type
        }))
        return
    
    key = "content" if data_type == "message_chunk" else "payload"
    await socket.send(text_data=json.dumps({
        "type": data_type,
        key: payload
    }))