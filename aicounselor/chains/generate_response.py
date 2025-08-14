from aicounselor.utils.llm.manager import get_llm_for
from aicounselor.chains.helpers import build_prompt_template
from aicounselor.utils.state import ChatState
from langchain.chains import LLMChain

def build_response_chain(llm, summary_exists: bool):
    prompt = build_prompt_template(summary_exists)
    return LLMChain(llm=llm, prompt=prompt)

async def generate_response_node(state: ChatState) -> ChatState:
    """
    평가 없이 응답만 생성하고 state에 저장
    """
    llm = get_llm_for("response", streaming=False)
    summary_exists = bool(state.get("summary_text"))
    chain = build_response_chain(llm, summary_exists)

    response = await chain.ainvoke(state)
    return {**state, "response": response}
