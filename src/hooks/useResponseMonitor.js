import { useState, useRef } from 'react';

const useResponseMonitor = () => {
  const [responseData, setResponseData] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    successCount: 0,
    errorCount: 0,
    avgResponseTime: 0
  });
  
  const startTimeRef = useRef(null);
  const responseTimes = useRef([]);

  const trackRequest = () => {
    startTimeRef.current = Date.now();
    console.log('📤 요청 시작:', new Date().toLocaleTimeString());
  };

  const trackResponse = (success = true, error = null) => {
    if (startTimeRef.current) {
      const responseTime = Date.now() - startTimeRef.current;
      const now = new Date();
      
      console.log(`📥 응답 완료: ${responseTime}ms, 성공: ${success}`);
      
      // 응답 시간 기록
      responseTimes.current.push(responseTime);
      if (responseTimes.current.length > 50) {
        responseTimes.current = responseTimes.current.slice(-50);
      }

      // 데이터 추가
      setResponseData(prev => [...prev, {
        time: now.toLocaleTimeString(),
        responseTime,
        status: success ? 'success' : 'error',
        error: error,
        timestamp: now.getTime()
      }].slice(-20)); // 최근 20개만 표시

      // 통계 업데이트
      setStats(prev => {
        const newTotal = prev.totalRequests + 1;
        const newSuccess = prev.successCount + (success ? 1 : 0);
        const newError = prev.errorCount + (success ? 0 : 1);
        const avgTime = responseTimes.current.reduce((a, b) => a + b, 0) / responseTimes.current.length;

        return {
          totalRequests: newTotal,
          successCount: newSuccess,
          errorCount: newError,
          avgResponseTime: Math.round(avgTime)
        };
      });
      
      startTimeRef.current = null;
    }
  };

  const trackError = (errorMessage) => {
    console.error('❌ 에러 발생:', errorMessage);
    trackResponse(false, errorMessage);
  };

  const trackChunk = (chunkSize) => {
    console.log('📦 청크 수신:', chunkSize, '바이트');
  };

  return { 
    trackRequest, 
    trackResponse, 
    trackError, 
    trackChunk,
    responseData, 
    stats 
  };
};

export default useResponseMonitor;