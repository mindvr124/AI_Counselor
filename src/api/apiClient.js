// src/api/apiClient.js
import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;
console.log('API URL:', apiUrl); 

const apiClient = axios.create({
  baseURL: apiUrl, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 추가 (요청을 보낼 때마다 콘솔에 출력)
apiClient.interceptors.request.use((config) => {
  console.log('📤 [Axios 요청]', {
    method: config.method?.toUpperCase(),
    url: config.baseURL + config.url,
    headers: config.headers,
    params: config.params,
    data: config.data,
  });
  return config;
});

export default apiClient;
