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

// CounselorAlertBox 컴포넌트 (변경 없음)
function CounselorAlertBox({ show, onClose }) {
  const knownCounselors = [
    { id: 1, name: "이서윤" },
    { id: 2, name: "러키비키" },
    { id: 3, name: "도현쌤" },
    { id: 4, name: "온유" },
    { id: 5, name: "사랑담" },
  ];

  return (
    <div>
      {show && (
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
              해당하는 상담가가 없습니다. 새로 추가하시거나 다음을 참고해주세요 :
            </span>
            <ul className="mt-1.5 list-disc list-inside">
              {knownCounselors.map((counselor) => (
                <li key={counselor.id}>
                  {counselor.id} : {counselor.name}
                </li>
              ))}
            </ul>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// SaveAlertBox 컴포넌트 (변경 없음)
function SaveAlertBox({ show, type, message, onClose }) {
  if (!show) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`flex p-4 mb-4 text-sm rounded-lg ${bgColor} ${textColor}`} role="alert">
      <svg
        className={`shrink-0 inline w-4 h-4 me-3 mt-[2px] ${iconColor}`}
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        {isSuccess ? (
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
        ) : (
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
        )}
      </svg>
      <span className="font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-auto ${isSuccess ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
        >
          ×
        </button>
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
    mbti: '', career: '', personality: '', 
    method: '', tone: '', specialty: '', prompt: ''
  });

  const [apiSettings, setApiSettings] = useState({
    model: 'gpt-4o', temperature: 0.2, stream: true
  });

  const [systemPrompt, setSystemPrompt] = useState(`당신은 전문적인 AI 심리상담가입니다...`);

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState(null); // 스트리밍 메시지 ID 추가
  const [activeTab, setActiveTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);
  const [invalidId, setInvalidId] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ show: false, type: '', message: '' });

  const reconnectTimeoutRef = useRef(null);
  const currentStreamMessageRef = useRef(''); // 최신 스트림 메시지 참조용

  // currentStreamMessage 변경 시 ref 업데이트
  useEffect(() => {
    currentStreamMessageRef.current = currentStreamMessage;
  }, [currentStreamMessage]);

  // WebSocket 연결 함수 및 로직 (모든 onmessage 처리 로직 포함)
  const connectWebSocket = () => {
    // 기존 소켓이 연결되어 있다면 먼저 닫음
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }
    setConnectionStatus('connecting');

    const ws = new WebSocket('wss://ai-counselor-backend.onrender.com/ws/');
    
    ws.onopen = () => {
      console.log("WebSocket connection established.");
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
      console.log("수신된 메시지:", data);

      switch (data.type) {
        case 'counselor_info':
          const counselorData = data.data || data.payload;
          console.log("받은 counselorData:", counselorData);
          
          const { prompt, ...counselorInfo } = counselorData;
          console.log("분리된 prompt:", prompt);
          console.log("prompt 타입:", typeof prompt);
          console.log("prompt 길이:", prompt?.length);
          
          setCounselorInfo(counselorInfo);
          
          // prompt가 있으면 사용하고, 없으면 기본값으로 설정
          const defaultPrompt = `당신은 전문적인 AI 심리상담가입니다...`;
          
          if (prompt && prompt.trim() !== '') {
            console.log("프롬프트 설정 중:", prompt);
            setSystemPrompt(prompt);
          } else {
            console.log("기본 프롬프트로 설정", defaultPrompt);
            setSystemPrompt(defaultPrompt);
          }
          
          break;
          
        case 'message_start':
          setIsLoading(true);
          setCurrentStreamMessage('');
          const newStreamingId = Date.now();
          setStreamingMessageId(newStreamingId);
          break;
          
        case 'message_chunk':
          setCurrentStreamMessage(prev => prev + data.content);
          break;
          
        case 'message_end':
          setIsLoading(false);
          // ref를 사용하여 최신 스트림 메시지 가져오기
          const finalMessage = currentStreamMessageRef.current;
          if (finalMessage) {
            setMessages(prev => [...prev, {
              type: 'ai',
              content: finalMessage,
              timestamp: new Date().toISOString(),
              id: streamingMessageId
            }]);
          }
          // 스트리밍 관련 상태 초기화
          setCurrentStreamMessage('');
          setStreamingMessageId(null);
          break;
          
        case 'error':
          setIsLoading(false);
          setCurrentStreamMessage('');
          setStreamingMessageId(null);
          if (data.message === "Counselor not found" || data.message?.includes("not found")) {
            setInvalidId(true);
            setSaveStatus({ show: true, type: 'error', message: '상담가 정보를 찾을 수 없습니다.' });
          } else {
            setMessages(prev => [...prev, {
              type: 'ai',
              content: data.message || '오류가 발생했습니다.',
              timestamp: new Date().toISOString(),
              id: Date.now()
            }]);
            setSaveStatus({ show: true, type: 'error', message: `오류 발생: ${data.message || '알 수 없는 오류'}` });
          }
          break;
          
        case 'save_success':
          setSaveStatus({ show: true, type: 'success', message: '상담가 정보가 성공적으로 저장되었습니다.' });
          setIsSaving(false);
          break;
          
        case 'save_error':
          setSaveStatus({ show: true, type: 'error', message: '저장 실패: ' + data.message });
          setIsSaving(false);
          break;
          
        default:
          console.warn("알 수 없는 메시지 타입:", data.type, data);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
      setConnectionStatus('disconnected');
      setIsConnected(false);
      setSocket(null);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus('error');
    };
  };

  // 컴포넌트 마운트 시 WebSocket 연결 시도 및 언마운트 시 정리
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // 저장 알림 표시 시간 관리
  useEffect(() => {
    if (saveStatus.show) {
      const timer = setTimeout(() => {
        setSaveStatus({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus.show]);

  // 프롬프트 탭 컴포넌트에서
  useEffect(() => {
    console.log("systemPrompt 변경됨:", systemPrompt);
  }, [systemPrompt]);

  // 상담가 정보 로드 함수
  const loadCounselorInfo = (id) => {
    console.log("📢 loadCounselorInfo 호출됨, id =", id);
    if (!id) {
      alert("상담사 ID를 입력해 주세요.");
      return;
    }
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'load_counselor', id: id }));
    } else {
      setSaveStatus({ show: true, type: 'error', message: 'WebSocket이 연결되지 않았습니다. 잠시 후 다시 시도해주세요.' });
    }
  };

  // 상담가 정보 저장 함수
  const saveCounselorInfo = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      setIsSaving(true);
      // 백엔드 데이터베이스 구조에 맞게 데이터 전송
      const counselorData = {
        ...counselorInfo,
        prompt: systemPrompt // 현재 시스템 프롬프트도 함께 저장
      };
      socket.send(JSON.stringify({ type: 'save_counselor', data: counselorData }));
    } else {
      setSaveStatus({ show: true, type: 'error', message: 'WebSocket이 연결되지 않았습니다. 상담가 정보를 저장할 수 없습니다.' });
      setIsSaving(false);
    }
  };

  const [userId, setUserId] = useState('');
  // 채팅 메시지 전송 함수
  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading || !socket || socket.readyState !== WebSocket.OPEN) return;

  const userMessage = {
    type: 'user',
    content: inputMessage,
    timestamp: new Date().toISOString(),
    id: Date.now()
  };
  setMessages(prev => [...prev, userMessage]);

  // 프롬프트 템플릿 변수 대체
  const processedPrompt = systemPrompt
    .replace('{name}', counselorInfo.name || '')
    .replace('{gender}', counselorInfo.gender || '')
    .replace('{age}', counselorInfo.age || '')
    .replace('{mbti}', counselorInfo.mbti || '')
    .replace('{career}', counselorInfo.career || '')
    .replace('{personality}', counselorInfo.personality || '')
    .replace('{method}', counselorInfo.method || '')
    .replace('{tone}', counselorInfo.tone || '')
    .replace('{specialty}', counselorInfo.specialty || '');

  socket.send(JSON.stringify({
    type: 'send_message',
    message: inputMessage,
    user_id: userId,
    counselor_id: counselorInfo.id, // 상담가 ID 추가
    systemPrompt: processedPrompt,
    apiSettings
  }));

  setInputMessage('');
};

// ChatInput 컴포넌트에 userId props 추가
<ChatInput
  inputMessage={inputMessage}
  setInputMessage={setInputMessage}
  userId={userId}
  setUserId={setUserId}
  sendMessage={sendMessage}
  isLoading={isLoading}
  isConnected={isConnected}
/>

  // 채팅 초기화 함수
  const resetChat = () => {
    setMessages([{
      type: 'ai',
      content: `안녕하세요! 저는 ${counselorInfo.name}입니다. 저에게 이름을 알려주세요!`,
      timestamp: new Date().toISOString(),
      id: Date.now()
    }]);
    setCurrentStreamMessage('');
    setStreamingMessageId(null);
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
            <>
              <CounselorAlertBox 
                show={invalidId} 
                onClose={() => setInvalidId(false)} 
              />
              <CounselorInfoForm
                counselorInfo={counselorInfo}
                setCounselorInfo={setCounselorInfo}
                loadCounselorInfo={loadCounselorInfo}
                isConnected={isConnected}
              />
            </>
          )}
          {activeTab === 'api' && (
            <ApiSettingsForm apiSettings={apiSettings} setApiSettings={setApiSettings} />
          )}
          {activeTab === 'prompt' && (
            <PromptEditor systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt} />
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <SaveAlertBox 
            show={saveStatus.show} 
            type={saveStatus.type} 
            message={saveStatus.message} 
            onClose={() => setSaveStatus({ show: false, type: '', message: '' })} 
          />
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

      {/* 오른쪽 채팅 패널 */}
      <div className="flex-1 flex flex-col">
        <ChatHeader counselorInfo={counselorInfo} isConnected={isConnected} resetChat={resetChat} />
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading} 
          currentStreamMessage={currentStreamMessage}
          streamingMessageId={streamingMessageId}
        />
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