from aicounselor.utils.state import ChatState
from aicounselor.utils.llm.manager import get_llm_for
from aicounselor.chains.generate_response import build_response_chain
from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler

def split_text_for_streaming(text, chunk_size=1000):
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]

async def evaluate_response_node(state: ChatState) -> str:
    print("🔥🔥🔥 [evaluate_response_node] 호출됨")
    return "retry"
    """
    1. 현재 응답을 평가
    2. retry면 다시 생성으로, satisfied면 스트리밍 전송 준비
    3. return 값은 LangGraph 조건 분기에 사용
    """
    print("🧪 evaluate_response_node 실행됨")

    eval_llm = get_llm_for("evaluation")
    user_input = state["user_input"]
    response = state["response"]
    history = state["chat_history"]

    history_text = "\n".join(
        f"{turn['사용자']}: {turn['AI']}" for turn in history
    )

    prompt = f"""
    지금까지의 대화:
    {history_text}
    ---------------------------
    사용자 질문: "{user_input}"
    AI 응답: "{response}"

    당신은 숙련된 심리상담 전문가입니다. AI의 응답이 사용자의 말에 적절하고 구체적인지 평가해주세요.
    아래 조건에 따라 'retry' 또는 'satisfied' 중 하나만 반환하세요.

    ### 📌 평가 기준:

    1. **공감의 질과 적절성**
    - 상담사가 내담자의 감정을 잘 이해하고 반응하고 있는가?
    - 단순 반복이나 형식적인 공감 표현이 아니라, 내담자의 맥락에 맞는 **구체적이고 적절한** 공감이 이루어졌는가?
    - 상황에 따라 필요 이상으로 감정에 몰입하거나, 지나친 긍정화/무조건적 위로를 하지 않았는가?

    2. **문제의 명확화**
    - 상담사가 내담자의 문제를 파악하고, 적절히 요약하거나 구체화하려고 노력했는가?

    3. **현실적이고 실행 가능한 개입**
    - 내담자의 상태를 고려한, 현실적이며 실행 가능한 조언이나 방향 제시가 있었는가?

    4. **중복 및 반복성 여부**
    - 의미 없는 표현 반복이나, 정보가 없는 말의 반복은 없었는가?

    5. **상담의 흐름과 완결성**
    - 상담의 도입-전개-마무리 흐름이 자연스럽고, 마무리가 성의 있게 이루어졌는가?
    """

    result = await eval_llm.ainvoke(prompt)
    feedback = result.content.strip().lower()
    print("🧪 평가 결과:", feedback)

    if "retry" in feedback:
        return "retry"

    # ✅ 평가 통과 시, 스트리밍 처리
    callback = AsyncIteratorCallbackHandler()
    streaming_llm = get_llm_for("response", streaming=True, callback=callback)
    summary_exists = bool(state.get("summary_text"))
    streaming_chain = build_response_chain(streaming_llm, summary_exists)

    await streaming_chain.ainvoke(state)  # 콜백에 토큰 채워짐

    # 콜백 저장 → consumer에서 꺼내 스트리밍 전달
    state["stream_callback"] = callback
    return "satisfied"
