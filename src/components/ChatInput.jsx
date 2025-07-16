// 메세지 입력창
import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ inputMessage, setInputMessage, userId, setUserId, sendMessage, isLoading, isConnected }) => {
  const textareaRef = useRef(null);

  // Enter 키 입력 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
      
      // 메시지 전송 후 포커스 유지
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  // 버튼 클릭 시에도 포커스 유지
  const handleSendClick = () => {
    sendMessage();
    
    // 메시지 전송 후 포커스 유지
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // 컴포넌트 마운트 시 포커스
  useEffect(() => {
    if (isConnected && !isLoading) {
      textareaRef.current?.focus();
    }
  }, [isConnected, isLoading]);

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex space-x-3">
        {/* 사용자 ID 입력창 */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">ID 입력</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="사용자 ID"
            className="w-24 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading || !isConnected}
          />
        </div>
        
        {/* 메시지 입력창 */}
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows="1"
          disabled={isLoading || !isConnected}
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