from aicounselor.utils.llm.get_llm import get_streaming_llm
from aicounselor.utils.llm.get_llm import get_generic_llm

def get_llm_for(task: str, streaming=False, callback=None):
    if task == "response":
        if streaming:
            if callback is None:
                raise ValueError("Streaming LLM requires a callback.")
            return get_streaming_llm("gpt-4o", 0.7, callback)
        else:
            return get_generic_llm("gpt-4o", 0.7)

    elif task == "summary":
        return get_generic_llm("gpt-4o", 0.3)

    elif task == "evaluation":
        return get_generic_llm("gpt-4o", 0.2)

    raise ValueError(f"지원되지 않는 task: {task}")