from langchain.callbacks.streaming_aiter import AsyncIteratorCallbackHandler
from langgraph.graph import StateGraph, END
from aicounselor.utils.state import ChatState
from aicounselor.utils.llm.manager import get_llm_for
from aicounselor.chains.summarize import build_summary_chain
from aicounselor.chains.evaluate_response import evaluate_response_node
from aicounselor.chains.generate_response import generate_response_node
from aicounselor.chains.generate_response import build_response_chain
from aicounselor.utils.llm.get_llm import get_generic_llm
from aicounselor.utils.llm.get_llm import get_streaming_llm

# LLM 초기화
callback = AsyncIteratorCallbackHandler()
response_llm = get_llm_for("response", streaming=True, callback=callback)
summary_llm = get_llm_for("summary")
eval_llm = get_llm_for("evaluation")

# 체인 준비
summary_chain = build_summary_chain(summary_llm)

# -------------------- 노드 정의 --------------------

async def load_summary_node(state: ChatState) -> ChatState:
    from aicounselor.utils.db.summary import get_counsel_summary
    summary = get_counsel_summary(state["user_id"])
    return {**state, "summary_text": summary or ""}

async def build_prompt_node(state: ChatState) -> ChatState:
    return state

async def generate_response_node(state: ChatState) -> ChatState:
    print("🧩 응답 생성 시작")

    # 1. 평가용 응답 생성 (streaming=False)
    eval_llm = get_generic_llm("gpt-4o", temperature=0.7)
    summary_exists = bool(state.get("summary_text", ""))
    eval_chain = build_response_chain(eval_llm, summary_exists)
    response = await eval_chain.ainvoke(state)
    state["response"] = response

    # 2. 평가
    from aicounselor.chains.evaluate_response import evaluate_response_node
    eval_result = await evaluate_response_node(state)

    if eval_result == "retry":
        print("⚠️ 평가 결과: retry → 재생성 예정")
        state["retry"] = True
        state["stream_callback"] = None
        return state

    # 3. 평가 통과 시 스트리밍 시작
    print("✅ 평가 결과: satisfied → 스트리밍 시작")
    callback = AsyncIteratorCallbackHandler()
    stream_llm = get_streaming_llm("gpt-4o", temperature=0.7, callback=callback)
    stream_chain = build_response_chain(stream_llm, summary_exists)
    _ = await stream_chain.ainvoke(state)

    state["retry"] = False
    state["stream_callback"] = callback
    return {**state, "response": response}

async def save_history_node(state: ChatState) -> ChatState:
    from aicounselor.utils.db.user import save_counsel_history
    save_counsel_history(
        user_id=state["user_id"],
        user_input=state["user_input"],
        answer=state["response"],
        counselor_id=state["counselor_id"]
    )
    return state

async def check_turn_count_node(state: ChatState) -> str:
    if state.get("turn_count", 0) >= 7:
        return "summarize"
    return END

async def summarize_node(state: ChatState) -> ChatState:
    summary = await summary_chain.ainvoke({
        "summary_text": state["summary_text"],
        "history": state["chat_history"]
    })
    return {**state, "summary_text": summary}

async def save_summary_node(state: ChatState) -> ChatState:
    from aicounselor.utils.db.summary import save_counsel_summary
    save_counsel_summary(state["user_id"], state["summary_text"])
    return state

# -------------------- 그래프 구성 --------------------

def build_chat_graph():
    graph = StateGraph(ChatState)

    graph.add_node("load_summary", load_summary_node)
    graph.add_node("build_prompt", build_prompt_node)
    graph.add_node("generate_response", generate_response_node)
    graph.add_node("evaluate_response", evaluate_response_node)
    graph.add_node("save_history", save_history_node)
    graph.add_node("check_turn_count", check_turn_count_node)
    graph.add_node("summarize", summarize_node)
    graph.add_node("save_summary", save_summary_node)

    # 진입점
    graph.set_entry_point("load_summary")

    # 흐름
    graph.add_edge("load_summary", "build_prompt")
    graph.add_edge("build_prompt", "generate_response")
    graph.add_edge("generate_response", "evaluate_response")

    # 평가 결과에 따라 재생성 or 저장
    graph.add_conditional_edges("evaluate_response", {
        "retry": "generate_response",
        "satisfied": "save_history"
    })

    graph.add_edge("save_history", "check_turn_count")

    graph.add_conditional_edges("check_turn_count", {
        "summarize": "summarize",
        END: END,
    })

    graph.add_edge("summarize", "save_summary")
    graph.add_edge("save_summary", END)

    return graph.compile()
