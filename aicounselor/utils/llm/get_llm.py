from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import os
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 스트리밍 모델 생성 함수
def get_streaming_llm(model, temperature, callback):
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        streaming=True,
        callbacks=[callback],
        openai_api_key=OPENAI_API_KEY
    )

# 기본 모델 생성 함수 (논스트리밍)
def get_generic_llm(model, temperature):
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        streaming=False,
        openai_api_key=OPENAI_API_KEY
    )