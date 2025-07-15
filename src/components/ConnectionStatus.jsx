// 연결 상태 아이콘
import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus = ({ status }) => {
  const getConnectionIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConnectionText = () => {
    switch (status) {
      case 'connected':
        return '연결됨';
      case 'connecting':
        return '연결 중...';
      case 'error':
        return '연결 오류';
      default:
        return '연결 끊김';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getConnectionIcon()}
      <span className="text-sm text-gray-600">{getConnectionText()}</span>
    </div>
  );
};

export default ConnectionStatus;
