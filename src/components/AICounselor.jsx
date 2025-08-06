// 전체 페이지 구성 (상위 컴포넌트)
import React, { useState, useEffect, useRef } from 'react';
import CounselorInfoForm from './CounselorInfoForm';
//import ApiSettingsForm from './ApiSettingsForm';
import LoginForm from './LoginForm';
import PromptEditor from './PromptEditor';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import ConnectionStatus from './ConnectionStatus';
import { Save } from 'lucide-react';
import { getUserInfoByToken } from '../api/authApi';
import { fetchCounselorById, updateCounselorById, createCounselor } from '../api/counselorApi';
import { sendMessageToLangflow } from '../api/chatApi';

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
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [counselorInfo, setCounselorInfo] = useState({
    id: '', code: '', name: '', age: '', gender: '', job: '', personality: '',
    speaking_style: '', feature: '', summary: '', specialties: '', main_age_group: '',
    counseling_method: '', career: '', background: '', hobby: '', ai_prompt: ''
  });

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ show: false, type: '', message: '' });
  const currentStreamMessageRef = useRef('');
  const [userId, setUserId] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [invalidId, setInvalidId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // HTTP ping으로 서버 연결 상태 확인
  const checkServerConnection = async () => {
    try {
      setConnectionStatus('connecting');
      
      console.log('🔍 서버 연결 확인 중: /');
      const response = await fetch('/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ 서버 연결 성공');
        setConnectionStatus('connected');
      } else {
        console.log('❌ 서버 연결 실패');
        setConnectionStatus('error');
      }
      
    } catch (error) {
      console.error('서버 연결 확인 실패:', error);
      setConnectionStatus('error');
    }
  };

  // 재연결 함수
  const handleReconnect = () => {
    checkServerConnection();
  };

  useEffect(() => {
    currentStreamMessageRef.current = currentStreamMessage;
  }, [currentStreamMessage]);

  // 컴포넌트 마운트 시 서버 연결 확인
  useEffect(() => {
    checkServerConnection();
    
    // 30초마다 연결 상태 확인
    const interval = setInterval(checkServerConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !userInfo) {
      getUserInfoByToken(token)
        .then((res) => {
          console.log('📥 사용자 정보 응답:', res.data);
          // API 응답 구조에 맞게 사용자 정보 추출
          const userData = res.data.data?.user || res.data.data || res.data;
          setUserInfo(userData);
          setIsLoggedIn(true);
        })
        .catch((err) => {
          console.error('❌ 사용자 정보 가져오기 실패:', err);
          localStorage.removeItem('token');
          setUserInfo(null);
          setIsLoggedIn(false);
        });
    }
  }, []);

  useEffect(() => {
    if (saveStatus.show) {
      const timer = setTimeout(() => setSaveStatus({ show: false, type: '', message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus.show]);

  // 상담가 정보가 변경될 때 채팅 리셋
  useEffect(() => {
    if (counselorInfo.id && messages.length > 0) {
      console.log('🔄 상담가 변경됨 - 채팅 리셋');
      resetChat();
    }
  }, [counselorInfo.id]); // 상담가 ID가 변경될 때만 실행

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    // 사용자 메시지 추가
    const userMessageObj = {
      type: 'user', 
      content: userMessage, 
      timestamp: new Date().toISOString(), 
      id: Date.now()
    };
    setMessages(prev => [...prev, userMessageObj]);

    try {
      console.log('🚀 Langflow로 메시지 전송:', userMessage);
      
      // Langflow API로 메시지 전송
      const response = await sendMessageToLangflow({
        user_id: userInfo?.user_id || 'anonymous',
        message: userMessage,
        counselorInfo: counselorInfo
      });

      // AI 응답 처리
      console.log('🔍 응답 파싱 시작:', response.data);
      let aiResponse = '';
      
      if (response.data && response.data.outputs) {
        console.log('📋 outputs 구조:', response.data.outputs);
        const outputs = response.data.outputs;
        if (outputs.length > 0 && outputs[0].outputs && outputs[0].outputs.length > 0) {
          aiResponse = outputs[0].outputs[0].results.message.text || '응답을 받을 수 없습니다.';
          console.log('✅ 파싱된 응답:', aiResponse);
        } else {
          console.log('❌ outputs 구조가 예상과 다름');
          aiResponse = '응답을 받을 수 없습니다.';
        }
      } else if (response.data && response.data.message) {
        aiResponse = response.data.message;
        console.log('✅ message 필드에서 응답:', aiResponse);
      } else if (response.data && response.data.text) {
        aiResponse = response.data.text;
        console.log('✅ text 필드에서 응답:', aiResponse);
      } else {
        console.log('❌ 응답 구조를 찾을 수 없음:', response.data);
        aiResponse = '응답을 받을 수 없습니다.';
      }

      // AI 응답 메시지 추가
      const aiMessageObj = {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        id: Date.now() + 1
      };
      setMessages(prev => [...prev, aiMessageObj]);

    } catch (error) {
      console.error('❌ 메시지 전송 실패:', error);
      
      // 에러 메시지 추가
      const errorMessageObj = {
        type: 'ai',
        content: '죄송합니다. 현재 응답할 수 없습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toISOString(),
        id: Date.now() + 1
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    const counselorName = counselorInfo.name || 'AI 상담가';
    setMessages([{ type: 'ai', content: `안녕하세요! 저는 ${counselorName}입니다. 저에게 이름을 알려주세요!`, timestamp: new Date().toISOString(), id: Date.now() }]);
    setCurrentStreamMessage('');
    setStreamingMessageId(null);
    
    // 세션 리셋을 위한 더미 메시지 전송 (선택사항)
    // Langflow에서 세션을 완전히 리셋하려면 별도의 API 호출이 필요할 수 있음
    console.log('🔄 채팅 리셋됨 - 새로운 세션 시작');
  };

  const loadCounselorInfo = async (id) => {
    try {
      const res = await fetchCounselorById(id);
      console.log("📥 상담가 응답 도착:", res.data);
      console.log("📥 상담가 데이터 구조:", res.data.data);

      // API 응답 구조에 따라 데이터 설정
      const counselorData = res.data.data || res.data;
      console.log("📥 설정할 상담가 데이터:", counselorData);

      setCounselorInfo(prev => {
        const newData = { ...prev, ...counselorData };
        console.log("📥 최종 상담가 상태:", newData);
        return newData;
      });

    } catch (err) {
      console.error('❌ 상담사 로딩 실패:', err);
      setInvalidId(true);
    }
  };

  const saveCounselorInfo = async () => {
    try {
      const { id, ...payload } = counselorInfo;
      
      // 기존 상담가 업데이트 시도
      try {
        const res = await updateCounselorById(id, payload);
        if (res.data.success) {
          setSaveStatus({ show: true, type: 'success', message: '상담가 정보가 저장되었습니다.' });
          return;
        } else {
          throw new Error(res.data.message || '알 수 없는 오류');
        }
      } catch (updateError) {
        // 404 에러일 경우 새 상담가 생성
        if (updateError.response && updateError.response.status === 404) {
          console.log('🆕 상담가가 존재하지 않습니다. 새로 생성합니다.');
          const createRes = await createCounselor({ id, ...payload });
          console.log("✅ 새 상담가 생성 성공:", createRes.data);
          setSaveStatus({ show: true, type: 'success', message: '새 상담가가 생성되었습니다.' });
        } else {
          throw updateError;
        }
      }
    } catch (error) {
      console.error('❌ 상담가 저장 실패:', error);
      setSaveStatus({ show: true, type: 'error', message: '상담가 저장 실패' });
    }
  };

  const handleLoginSuccess = async (token) => {
    localStorage.setItem('token', token);
    setActiveTab('info');
    setIsLoggedIn(true);
    try {
      const res = await getUserInfoByToken(token);
      console.log('📥 로그인 후 사용자 정보:', res.data);
      // API 응답 구조에 맞게 사용자 정보 추출
      const userData = res.data.data?.user || res.data.data || res.data;
      setUserInfo(userData);
    } catch (err) {
      console.error('사용자 정보 가져오기 실패', err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-[28rem] bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <ConnectionStatus status={connectionStatus} />
          <button 
            onClick={handleReconnect}
            className={`text-xs ${connectionStatus === 'connected' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
            disabled={connectionStatus === 'connected'}
          >
            재연결
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {['login', 'info', 'prompt'].map((tab) => (
            <button
              key={tab}
              onClick={() => { if (tab !== 'login' && !isLoggedIn) return; setActiveTab(tab); }}
              disabled={tab !== 'login' && !isLoggedIn}
              className={`flex-1 py-3 px-4 text-sm font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'} ${tab !== 'login' && !isLoggedIn ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab === 'login' ? '로그인' : tab === 'info' ? '상담가 정보' : '프롬프트'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'login' && (isLoggedIn && userInfo ? (
            <div className="px-4 py-3 border border-gray-200 bg-gray-50 rounded-md shadow-sm">
              <div className="flex justify-between items-center">
                                 <div>
                   <div className="text-sm font-semibold text-gray-800">👤 {userInfo.name}</div>
                   <div className="text-xs text-gray-500">{userInfo.user_id}</div>
                 </div>
                <button onClick={() => { localStorage.removeItem('token'); setUserInfo(null); setIsLoggedIn(false); setActiveTab('login'); }} className="text-sm text-red-500 hover:underline">로그아웃</button>
              </div>
            </div>
          ) : <LoginForm onLoginSuccess={handleLoginSuccess} />)}

          {activeTab === 'info' && (
            <>
              <CounselorAlertBox show={invalidId} onClose={() => setInvalidId(false)} />
              <CounselorInfoForm 
                counselorInfo={counselorInfo} 
                setCounselorInfo={setCounselorInfo} 
                loadCounselorInfo={loadCounselorInfo} 
                isConnected={connectionStatus === 'connected'} 
              />
            </>
          )}

                     {activeTab === 'prompt' && (
             <PromptEditor 
               systemPrompt={counselorInfo.ai_prompt} 
               setSystemPrompt={(value) => setCounselorInfo(prev => ({ ...prev, ai_prompt: value }))} 
             />
           )}
        </div>

        {isLoggedIn && (
          <div className="p-4 border-t border-gray-200">
            <SaveAlertBox show={saveStatus.show} type={saveStatus.type} message={saveStatus.message} onClose={() => setSaveStatus({ show: false, type: '', message: '' })} />
            <button
              onClick={saveCounselorInfo}
              disabled={isSaving}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '저장 중...' : '저장'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <ChatHeader counselorInfo={counselorInfo} isConnected={connectionStatus === 'connected'} resetChat={resetChat} />
        <ChatMessages messages={messages} isLoading={isLoading} currentStreamMessage={currentStreamMessage} streamingMessageId={streamingMessageId} />
        {counselorInfo?.id && (
        <ChatInput inputMessage={inputMessage} setInputMessage={setInputMessage} userId={userId} setUserId={setUserId} counselorInfo={counselorInfo} sendMessage={sendMessage} isLoading={isLoading} isConnected={connectionStatus === 'connected'} disabled={!isLoggedIn} />
        )};
      </div>
    </div>
  );
};

export default AICounselor;
