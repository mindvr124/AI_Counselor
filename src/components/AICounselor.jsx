// 전체 페이지 구성 (상위 컴포넌트)
import React, { useState, useEffect, useRef } from 'react';
import CounselorInfoForm from './CounselorInfoForm';
import ApiSettingsForm from './ApiSettingsForm';
import PromptEditor from './PromptEditor';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ConnectionStatus from './ConnectionStatus';
import { Save } from 'lucide-react';

function CounselorAlertBox() {
  const [invalidId, setInvalidId] = useState(false);

  const knownCounselors = [
    { id: 1, name: "이서윤" },
    { id: 2, name: "러키비키" },
    { id: 3, name: "도현쌤" },
    { id: 4, name: "온유" },
    { id: 5, name: "사랑담" },
  ];

  return (
    <div>
      {invalidId && (
        <div
          className="flex p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400"
          role="alert"
        >
          <svg
            className="shrink-0 inline w-4 h-4 me-3 mt-[2px]"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
          </svg>
          <span className="sr-only">Info</span>
          <div>
            <span className="font-medium">
              해당하는 상담가가 없습니다. 새로 추가하시거나 다음을 참고해주세요.:
            </span>
            <ul className="mt-1.5 list-disc list-inside">
              {knownCounselors.map((counselor) => (
                <li key={counselor.id}>
                  {counselor.id} : {counselor.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const AICounselor = () => {
  // 상태 관리
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const [counselorInfo, setCounselorInfo] = useState({
    id: '', name: '', gender: '', age: '',
    personality: '', tone: '', specialty: '',
    career: '', method: ''
  });

  const [apiSettings, setApiSettings] = useState({
    model: 'gpt-4', temperature: 0.7, maxTokens: 2000, topP: 1.0, stream: true
  });

  const [systemPrompt, setSystemPrompt] = useState(`당신은 전문적인 AI 심리상담가입니다...`);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);

  //const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // WebSocket 연결 함수 및 로직
  const connectWebSocket = () => {
    if (socket) socket.close();
    setConnectionStatus('connecting');

    const ws = new WebSocket('wss://prompt-test-server.onrender.com/ws');
    ws.onopen = () => {
      setConnectionStatus('connected');
      setIsConnected(true);
      setSocket(ws);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'counselor_info':
          setCounselorInfo(data.data);
          setMessages([{
            type: 'ai',
            content: `안녕하세요! 저는 ${data.data.name}입니다. 오늘은 어떤 이야기를 나누고 싶으신가요?`,
            timestamp: new Date().toISOString()
          }]);
          break;
        case 'message_start':
          setIsLoading(true); setCurrentStreamMessage(''); break;
        case 'message_chunk':
          setCurrentStreamMessage(prev => prev + data.content); break;
        case 'message_end':
          setIsLoading(false);
          setMessages(prev => [...prev, {
            type: 'ai', content: currentStreamMessage, timestamp: new Date().toISOString()
          }]);
          setCurrentStreamMessage('');
          break;
        case 'error':
          setIsLoading(false);
          setMessages(prev => [...prev, {
            type: 'ai', content: data.message || '오류가 발생했습니다.', timestamp: new Date().toISOString()
          }]);
          break;
        case 'save_success':
          alert('상담가 정보가 저장되었습니다.');
          setIsSaving(false); break;
        case 'save_error':
          alert('저장 실패: ' + data.message);
          setIsSaving(false); break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      setSocket(null);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = () => {
      setConnectionStatus('error');
    };
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socket) socket.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const [invalidId, setInvalidId] = useState(false);
  const loadCounselorInfo = (id) => {
    console.log("📢 loadCounselorInfo 호출됨, id =", id);
    if (!id) {
    alert("상담사 ID를 입력해 주세요.");
    return;
    }
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'load_counselor', id }));
    }
  };

    // 2. WebSocket 메시지 수신용 useEffect (새로 추가)
  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "counselor_info") {
        setCounselorInfo(data.payload);
        setInvalidId(false);
      } else if (data.type === "error") {
        setInvalidId(true);
      }
    };
  }, [socket]);
    
  const saveCounselorInfo = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      setIsSaving(true);
      socket.send(JSON.stringify({ type: 'save_counselor', data: counselorInfo }));
    }
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading || !socket || socket.readyState !== WebSocket.OPEN) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    const processedPrompt = systemPrompt
      .replace('{name}', counselorInfo.name)
      .replace('{gender}', counselorInfo.gender)
      .replace('{age}', counselorInfo.age)
      .replace('{personality}', counselorInfo.personality)
      .replace('{tone}', counselorInfo.tone)
      .replace('{specialty}', counselorInfo.specialty)
      .replace('{career}', counselorInfo.career)
      .replace('{method}', counselorInfo.method);

    socket.send(JSON.stringify({
      type: 'send_message',
      message: inputMessage,
      systemPrompt: processedPrompt,
      apiSettings,
      messageHistory: messages.slice(-10)
    }));

    setInputMessage('');
  };

  const resetChat = () => {
    setMessages([{
      type: 'ai',
      content: `안녕하세요! 저는 ${counselorInfo.name}입니다. 오늘은 어떤 이야기를 나누고 싶으신가요?`,
      timestamp: new Date().toISOString()
    }]);
    setCurrentStreamMessage('');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 왼쪽 패널 */}
      <div className="w-96 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* 연결 상태 및 탭 */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <ConnectionStatus status={connectionStatus} />
          <button onClick={connectWebSocket} className="text-xs text-blue-600 hover:text-blue-800">
            재연결
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {['info', 'api', 'prompt'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              {tab === 'info' ? '상담가 정보' : tab === 'api' ? 'API 설정' : '프롬프트'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'info' && (
            <CounselorInfoForm
              counselorInfo={counselorInfo}
              setCounselorInfo={setCounselorInfo}
              loadCounselorInfo={loadCounselorInfo}
              isConnected={isConnected}
            />
          )}
          {activeTab === 'api' && (
            <ApiSettingsForm apiSettings={apiSettings} setApiSettings={setApiSettings} />
          )}
          {activeTab === 'prompt' && (
            <PromptEditor systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt} />
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={saveCounselorInfo}
            disabled={isSaving || !isConnected}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '저장'}</span>
          </button>
        </div>
      </div>

      {/* 오른쪽 패널 */}
      <div className="flex-1 flex flex-col">
        <ChatHeader counselorInfo={counselorInfo} isConnected={isConnected} resetChat={resetChat} />
        <ChatMessages messages={messages} isLoading={isLoading} currentStreamMessage={currentStreamMessage} />
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sendMessage={sendMessage}
          isLoading={isLoading}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default AICounselor;
