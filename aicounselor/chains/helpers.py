# 프롬프트 포맷
from langchain.prompts import PromptTemplate
from aicounselor.utils.state import ChatState

def format_counselor_profile(counselor_info: dict) -> str:
    if not counselor_info:
        return ""
    return f"""상담가 정보:
    - 이름: {counselor_info.get('name')}
    - 성별: {counselor_info.get('gender')}
    - 나이: {counselor_info.get('age')}
    - 직업: {counselor_info.get('job')}
    - 경력: {counselor_info.get('career')}
    - 전문 분야: {counselor_info.get('specialty')}
    - 주요 상담 연령대: {counselor_info.get('client_age_focus')}
    - 성격: {counselor_info.get('personality')}
    - 말투: {counselor_info.get('tone')}
    - 특징: {counselor_info.get('feature')}
    - 상담 방법: {counselor_info.get('method')}
    - 배경 이야기: {counselor_info.get('backstory')}
    - 취미: {counselor_info.get('hobby')}
    - 한 줄 소개: {counselor_info.get('short_intro')}
    """.strip()

def build_prompt_template(summary_data_exists: bool) -> PromptTemplate:
    if summary_data_exists:
        return PromptTemplate(
            input_variables=[
                "counselor_profile", "system_prompt",
                "summary_data", "current_session_history", "user_input"
            ],
            template="""{counselor_profile}

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

                        상담가:"""
        )
    else:
        return PromptTemplate(
            input_variables=[
                "counselor_profile", "system_prompt",
                "current_session_history", "user_input"
            ],
            template="""{counselor_profile}

                        시스템 지침:
                        {system_prompt}

                        '현재 세션 대화'는 실시간 요약중인 대화입니다. 인사를 하지 말고 대화를 이어나가주세요.

                        현재 세션 대화:
                        {current_session_history}

                        사용자: {user_input}

                        위의 상담가 정보를 바탕으로 해당 상담가의 정보를 모두 반영하여 응답하세요.
                        상담가 고유 프롬프트와 시스템 지침을 준수하고, 현재 세션 대화의 맥락을 이어가세요.

                        상담가:"""
        )

async def build_prompt_node(state: ChatState) -> ChatState:
    counselor_profile = format_counselor_profile(state["counselor_info"])
    summary_exists = bool(state.get("summary_text"))

    prompt_template = build_prompt_template(summary_exists)

    prompt_vars = {
        "counselor_profile": counselor_profile,
        "system_prompt": state.get("system_prompt", ""),
        "current_session_history": state.get("chat_history", ""),  # 문자열이어야 함
        "user_input": state.get("user_input", "")
    }

    if summary_exists:
        prompt_vars["summary_data"] = state["summary_text"]

    prompt = prompt_template.format_prompt(**prompt_vars).to_string()

    return {
        **state,
        "prompt": prompt
    }
