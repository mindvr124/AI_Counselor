import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
const ChatInput = ({ inputMessage, setInputMessage, userId, setUserId, counselorInfo, sendMessage, isLoading, isConnected, disabled }) => {
  const textareaRef = useRef(null);

  // 디버깅: props 확인
  useEffect(() => {
    console.log('ChatInput Props:', {
      inputMessage,
      userId,
      setUserId: typeof setUserId,
      isLoading,
      isConnected,
      counselorInfo,
      disabled
    });
  }, [inputMessage, userId, setUserId, isLoading, isConnected, counselorInfo, disabled]);

  // Enter 키 입력 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log("🔍 counselorInfo:", counselorInfo);
      if (counselorInfo.id == null){
        console.error('상담가 정보 없음');
      }
      else{
        sendMessage();
      }
      
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  // 안전한 userId 변경 핸들러
  const handleUserIdChange = (e) => {
    console.log('handleUserIdChange 호출됨:', e.target.value);
    console.log('setUserId 타입:', typeof setUserId);
    
    if (setUserId && typeof setUserId === 'function') {
      try {
        setUserId(e.target.value);
      } catch (error) {
        console.error('setUserId 에러:', error);
      }
    } else {
      console.error('setUserId가 함수가 아님:', setUserId);
    }
  };

  const handleSendClick = () => {
    sendMessage(userId);
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (isConnected && !isLoading) {
      textareaRef.current?.focus();
    }
  }, [isConnected, isLoading]);

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex space-x-3">        
        {/* 메시지 입력창 */}
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || isLoading || !isConnected}
          placeholder={
            disabled
              ? "로그인 후 이용해주세요"
              : !isConnected
              ? "서버 연결이 끊겼습니다"
              : "메시지를 입력하세요..."
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows="1"
        />
        
        {/* 전송 버튼 */}
        <button
          onClick={handleSendClick}
          disabled={isLoading || !inputMessage.trim() || !isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;