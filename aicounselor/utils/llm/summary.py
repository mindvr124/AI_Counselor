# 요약 기능
from langchain.prompts import PromptTemplate

def generate_summary(llm, history, summary_text):
    summary_template = PromptTemplate(
        input_variables=["history", "summary_text"],
        template="""
        이전 요약 대화:
        {summary_text}

        -----------------
        다음은 현재 진행중인 상담 대화 기록입니다. 
        사용자의 이름, 상담 이유와 그에 관련된 핵심 내용을 중복이 없도록 요약해 주세요.
        이전 요약 대화에서 중요한 내용은 삭제하지 말고 덧붙여서 요약해주세요.

        무의미한 대화나 인사만 있는 경우 요약하지 말고 대화 내용을 그대로 작성해 주세요.
        -----------------

        실시간 대화:
        {history}
        """
    )
    summary_chain = summary_template | llm
    return summary_chain.ainvoke({
        "summary_text": summary_text,
        "history": history
    })