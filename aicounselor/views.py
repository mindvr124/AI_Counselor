from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"message": "WebSocket 연결됨!"}))

    async def receive(self, text_data):
        await self.send(text_data=json.dumps({"echo": text_data}))
