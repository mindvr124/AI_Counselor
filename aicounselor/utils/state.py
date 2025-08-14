# State 정의 (임시)
from typing import TypedDict

class ChatState(TypedDict, total=False):
    user_id: str
    user_input: str
    counselor_id: str
    summary_text: str
    response: str
    chat_history: list[dict]
    turn_count: int
