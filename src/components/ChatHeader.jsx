// 채팅 헤더 (상담사 이름, 연결 상태 등)
import React from 'react';
import { User, RefreshCw } from 'lucide-react';

const ChatHeader = ({ counselorInfo, isConnected, resetChat }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 상담사 정보 */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {counselorInfo.name || '상담가'}
            </h2>
            <p className="text-sm text-gray-500">
              {isConnected ? '온라인' : '오프라인'} • {counselorInfo.specialty || '심리상담'}
            </p>
          </div>
        </div>

        {/* 새로고침 버튼 */}
        <button
          onClick={resetChat}
          className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className="w-4 h-4" />
          <span>새로고침</span>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
