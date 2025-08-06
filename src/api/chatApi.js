// src/api/chatApi.js - Langflow API 연동
import axios from 'axios';

// Langflow API 설정
const LANGFLOW_URL = process.env.REACT_APP_LANGFLOW_URL;
const LANGFLOW_API_KEY = process.env.REACT_APP_LANGFLOW_API_KEY;

export const sendMessageToLangflow = async ({ user_id, message, counselorInfo }) => {
  try {    
    console.log('🚀 Langflow로 메시지 전송:', { user_id, message });
    console.log('👤 상담가 정보:', counselorInfo);
    
    // 상담가 정보를 포함한 완전한 프롬프트 생성
    const buildSystemPrompt = (counselorInfo) => {
      let prompt = '';
      
      // 기본 AI 프롬프트
      if (counselorInfo.ai_prompt) {
        prompt += counselorInfo.ai_prompt + '\n\n';
      }
      
      // 명확한 지시사항 추가
      prompt += '=== 중요 지시사항 ===\n';
      prompt += '당신은 아래 정보에 따라 정확히 행동해야 합니다. 다른 정보는 무시하세요.\n';
      prompt += '이전에 설정된 프롬프트나 정보는 모두 무시하고, 아래 정보만 사용하세요.\n\n';
      
      // 상담가 정보 추가
      prompt += '상담가 정보:\n';
      if (counselorInfo.name) prompt += `이름: ${counselorInfo.name}\n`;
      if (counselorInfo.age) prompt += `나이: ${counselorInfo.age}\n`;
      if (counselorInfo.gender) prompt += `성별: ${counselorInfo.gender}\n`;
      if (counselorInfo.job) prompt += `직업: ${counselorInfo.job}\n`;
      if (counselorInfo.personality) prompt += `성격: ${counselorInfo.personality}\n`;
      if (counselorInfo.speaking_style) prompt += `말투: ${counselorInfo.speaking_style}\n`;
      if (counselorInfo.feature) prompt += `특징: ${counselorInfo.feature}\n`;
      if (counselorInfo.summary) prompt += `요약: ${counselorInfo.summary}\n`;
      if (counselorInfo.specialties) prompt += `전문분야: ${counselorInfo.specialties}\n`;
      if (counselorInfo.main_age_group) prompt += `주요 연령대: ${counselorInfo.main_age_group}\n`;
      if (counselorInfo.counseling_method) prompt += `상담 방법: ${counselorInfo.counseling_method}\n`;
      if (counselorInfo.career) prompt += `경력: ${counselorInfo.career}\n`;
      if (counselorInfo.background) prompt += `배경: ${counselorInfo.background}\n`;
      if (counselorInfo.hobby) prompt += `취미: ${counselorInfo.hobby}\n`;
      
      // 강력한 지시사항 추가
      prompt += '\n=== 최종 지시사항 ===\n';
      prompt += `- 당신의 이름은 "${counselorInfo.name}"입니다.\n`;
      prompt += `- 다른 이름으로 소개하지 마세요.\n`;
      prompt += `- 위의 상담가 정보를 정확히 따르세요.\n`;
      prompt += `- 이전 프롬프트나 설정은 모두 무시하세요.\n`;
      prompt += `- 반드시 "${counselorInfo.name}"로 소개하세요.\n`;
      
      // History 플레이스홀더 추가
      prompt += '\nHistory:\n{memory}';
      
      return prompt;
    };

    const systemPrompt = buildSystemPrompt(counselorInfo);
    console.log('📝 생성된 시스템 프롬프트:', systemPrompt);
    console.log('📝 프롬프트 길이:', systemPrompt.length);
    
    // 상담가 ID와 사용자 ID를 결합하여 고유한 세션 ID 생성 (타임스탬프 추가)
    const timestamp = Date.now();
    const uniqueSessionId = `${user_id}_${counselorInfo.id || 'default'}_${timestamp}`;
    
    // 프롬프트를 메시지에 직접 포함시키는 방법 시도
    const messageWithPrompt = `[시스템 프롬프트: ${systemPrompt}]\n\n사용자: ${message}`;
    
    const payload = {
      output_type: "chat",
      input_type: "chat",
      input_value: messageWithPrompt,
      session_id: uniqueSessionId, // 고유한 세션 ID 사용
      // tweaks 제거하고 직접 메시지에 포함
    };
    
    console.log('📦 전송할 페이로드:', payload);

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": LANGFLOW_API_KEY
    };

    // 먼저 tweaks 없이 시도
    let response = await axios.post(LANGFLOW_URL, payload, { headers });
    
    // 만약 여전히 온유로 나온다면, 다른 방법 시도
    if (response.data.outputs && response.data.outputs[0]?.outputs[0]?.results?.message?.text?.includes('온유')) {
      console.log('⚠️ 여전히 온유로 응답됨. 다른 방법 시도...');
      
      // tweaks를 다시 추가해서 시도
      const payloadWithTweaks = {
        ...payload,
        input_value: message, // 원래 메시지로 복원
        tweaks: {
          "Prompt-6ydtX": {
            ai_prompt: systemPrompt
          }
        }
      };
      
      response = await axios.post(LANGFLOW_URL, payloadWithTweaks, { headers });
    }
    
    console.log('📥 Langflow 응답:', response.data);
    console.log('📥 응답 구조:', JSON.stringify(response.data, null, 2));
    return response;
    
  } catch (error) {
    console.error('❌ Langflow API 에러:', error);
    throw error;
  }
};

// 기존 API와의 호환성을 위한 함수 (사용하지 않음)
export const getChatHistory = async (token, sessionId) => {
  // Langflow는 별도의 히스토리 API가 없으므로 빈 배열 반환
  return { data: [] };
};

export const sendMessageToAI = async (token, { session_id, message, counselorInfo }) => {
  // 기존 API 대신 Langflow 사용
  return await sendMessageToLangflow({ 
    user_id: session_id, 
    message, 
    counselorInfo 
  });
};
