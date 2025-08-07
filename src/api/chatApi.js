// src/api/chatApi.js - Langflow API 연동
import axios from 'axios';

// Langflow API 설정
const LANGFLOW_URL = process.env.REACT_APP_LANGFLOW_URL;
const LANGFLOW_API_KEY = process.env.REACT_APP_LANGFLOW_API_KEY;
console.log('✅ LANGFLOW_URL:', LANGFLOW_URL);

export const sendMessageToLangflow = async ({ user_id, message, counselorInfo }) => {
  try {
    console.log('🚀 Langflow로 메시지 전송:', { user_id, message });
    console.log('👤 상담가 정보:', counselorInfo);

    // 상담가 정보를 포함한 시스템 프롬프트 생성
    const buildSystemPrompt = (counselorInfo) => {
      let prompt = '';

      if (counselorInfo.ai_prompt) {
        prompt += counselorInfo.ai_prompt + '\n\n';
      }

      prompt += '=== 중요 지시사항 ===\n';
      prompt += '당신은 아래 정보에 따라 정확히 행동해야 합니다. 다른 정보는 무시하세요.\n';
      prompt += '이전에 설정된 프롬프트나 정보는 모두 무시하고, 아래 정보만 사용하세요.\n\n';

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

      prompt += '\n=== 최종 지시사항 ===\n';
      prompt += `- 당신의 이름은 \"${counselorInfo.name}\"입니다.\n`;
      prompt += '- 다른 이름으로 소개하지 마세요.\n';
      prompt += '- 위의 상담가 정보를 정확히 따르세요.\n';
      prompt += '- 반드시 해당 이름으로 소개하세요.\n';

      return prompt;
    };

    const systemPrompt = buildSystemPrompt(counselorInfo);
    console.log('📝 생성된 시스템 프롬프트:', systemPrompt);

    const timestamp = Date.now();
    const uniqueSessionId = `${user_id}_${counselorInfo.id || 'default'}_${timestamp}`;

    const payload = {
      message: message,
      session_id: uniqueSessionId,
      counselor_info: {
        ...counselorInfo,
        ai_prompt: systemPrompt,
      }
    };

    console.log('📦 전송할 페이로드:', payload);

    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await axios.post(
      `${LANGFLOW_URL}/api/v1/run`,
      payload,
      { headers }
    );

    console.log('📥 Langflow 응답:', response.data);
    return response;
  } catch (error) {
    console.error('❌ Langflow API 에러:', error);
    throw error;
  }
};

export const getChatHistory = async (token, sessionId) => {
  return { data: [] };
};

export const sendMessageToAI = async (token, { session_id, message, counselorInfo }) => {
  return await sendMessageToLangflow({ 
    user_id: session_id, 
    message, 
    counselorInfo 
  });
};
