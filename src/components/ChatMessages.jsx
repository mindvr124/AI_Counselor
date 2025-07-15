// 채팅 메세지 목록
import React, { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';

const ChatMessages = ({ messages, currentStreamMessage, isLoading }) => {
  const messagesEndRef = useRef(null);

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamMessage]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <div className="flex items-start space-x-2">
              {message.type === 'ai' && (
                <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        </div>
      ))}

      {/* 스트리밍 중인 메시지 */}
      {currentStreamMessage && (
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
            <div className="flex items-start space-x-2">
              <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <div className="whitespace-pre-wrap">{currentStreamMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 애니메이션 */}
      {isLoading && !currentStreamMessage && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-blue-600" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 스크롤 앵커 */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
