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
  const [invalidId, setInvalidId] = useState(false); // counselor_info 로드 실패 시 사용
  const [saveStatus, setSaveStatus] = useState({ show: false, type: '', message: '' }); // 저장 알림 상태

  const reconnectTimeoutRef = useRef(null);

  // WebSocket 연결 함수 및 로직 (모든 onmessage 처리 로직 포함)
  const connectWebSocket = () => {
    // 기존 소켓이 연결되어 있다면 먼저 닫음
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      socket.close();
    }
    setConnectionStatus('connecting');

    const ws = new WebSocket('ws://localhost:8000/ws/');
    
    ws.onopen = () => {
      console.log("WebSocket connection established.");
      setConnectionStatus('connected');
      setIsConnected(true);
      setSocket(ws); // 상태 업데이트
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
          // 상담가 정보 로드 성공 시
          setCounselorInfo(data.data || data.payload); // 백엔드 응답에 따라 'data' 또는 'payload' 사용
          setInvalidId(false); // 유효한 ID이므로 경고 해제
          // 상담 시작 메시지 초기화
          setMessages([{
            type: 'ai',
            content: `안녕하세요! 저는 ${data.data?.name || data.payload?.name}입니다. 오늘은 어떤 이야기를 나누고 싶으신가요?`,
            timestamp: new Date().toISOString()
          }]);
          break;
        case 'message_start':
          setIsLoading(true);
          setCurrentStreamMessage('');
          break;
        case 'message_chunk':
          setCurrentStreamMessage(prev => prev + data.content);
          break;
        case 'message_end':
          setIsLoading(false);
          setMessages(prev => [...prev, {
            type: 'ai', content: currentStreamMessage, timestamp: new Date().toISOString()
          }]);
          setCurrentStreamMessage('');
          break;
        case 'error':
          // 서버에서 발생한 오류 처리 (로드 오류, 채팅 오류 등)
          setIsLoading(false); // 혹시 채팅 로딩 중 오류가 났다면 로딩 상태 해제
          if (data.message === "Counselor not found" || data.message?.includes("not found")) { // 백엔드의 오류 메시지 형식에 따라 조건 조정
            setInvalidId(true); // 상담가 없음 경고 표시
            setSaveStatus({ show: true, type: 'error', message: '상담가 정보를 찾을 수 없습니다.' });
          } else {
            setMessages(prev => [...prev, {
              type: 'ai', content: data.message || '오류가 발생했습니다.', timestamp: new Date().toISOString()
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
      setSocket(null); // socket 상태를 null로 설정하여 재연결 트리거
      // 자동 재연결 로직 (3초 후 시도)
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus('error');
      // 오류 발생 시 재연결 시도 (onclose에서 이미 처리됨)
    };
  };

  // 컴포넌트 마운트 시 WebSocket 연결 시도 및 언마운트 시 정리
  useEffect(() => {
    connectWebSocket();
    return () => {
      // 언마운트 시 WebSocket 연결 정리
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
      // 재연결 타임아웃이 있다면 해제
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시 한 번만 실행

  // 저장 알림 표시 시간 관리
  useEffect(() => {
    if (saveStatus.show) {
      const timer = setTimeout(() => {
        setSaveStatus({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus.show]);

  // 상담가 정보 로드 함수 (WebSocket으로 요청 전송)
  const loadCounselorInfo = (id) => {
    console.log("📢 loadCounselorInfo 호출됨, id =", id);
    if (!id) {
      alert("상담사 ID를 입력해 주세요.");
      return;
    }
    if (socket?.readyState === WebSocket.OPEN) {
      // 백엔드에서 load_counselor 요청을 'id' 파라미터로 받도록 해야 함
      socket.send(JSON.stringify({ type: 'load_counselor', id: id }));
    } else {
      setSaveStatus({ show: true, type: 'error', message: 'WebSocket이 연결되지 않았습니다. 잠시 후 다시 시도해주세요.' });
    }
  };

  // 상담가 정보 저장 함수 (WebSocket으로 요청 전송)
  const saveCounselorInfo = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      setIsSaving(true);
      // counselorInfo 객체를 백엔드로 전송
      socket.send(JSON.stringify({ type: 'save_counselor', data: counselorInfo }));
    } else {
      setSaveStatus({ show: true, type: 'error', message: 'WebSocket이 연결되지 않았습니다. 상담가 정보를 저장할 수 없습니다.' });
      setIsSaving(false); // 소켓 연결 안되면 저장 상태 해제
    }
  };

  // 채팅 메시지 전송 함수
  const sendMessage = () => {
    if (!inputMessage.trim() || isLoading || !socket || socket.readyState !== WebSocket.OPEN) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    // 프롬프트 템플릿 변수 대체
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
      messageHistory: messages.slice(-10) // 최근 10개 메시지 전송
    }));

    setInputMessage('');
  };

  // 채팅 초기화 함수
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