from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

def build_summary_chain(llm):
    prompt = PromptTemplate(
        input_variables=["history", "summary_text"],
        template="""
        이전 요약 대화:
        {summary_text}

        -----------------
        다음은 현재 진행중인 상담의 대화 기록입니다. 
        사용자의 이름, 심리 상태, 상담 이유와 그에 관련된 핵심 내용을 중복이 없도록 요약해 주세요.
        이전 요약 대화에서 중요한 내용은 삭제하지 말고 덧붙여서 요약해주세요.

        무의미한 대화나 인사만 있는 경우 요약하지 말고 받은 데이터를 그대로 보내주세요.
        -----------------

        실시간 대화:
        {history}
        """
    )

    return prompt | llm | StrOutputParser()