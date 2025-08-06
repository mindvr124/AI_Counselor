// 회원 관리
import apiClient from './apiClient';

export const login = async (user_id, password) => {
  console.log('🚀 로그인 요청 전송됨:', user_id, password);
  console.log('🚀 API URL:', apiClient.defaults.baseURL);
  console.log('🚀 요청 데이터:', { user_id, password });
  return await apiClient.post('/login', { user_id, password });
};

export const logout = async (token) => {
  return await apiClient.post('/logout', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getUserInfoByToken = async (token) => {
  return await apiClient.get('/user/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const getCounselorInfo = async (id) => {
  return await apiClient.get(`/counselors/${id}`);
}

export const addCounselorInfo = async (id) => {
  return await apiClient.post('/counselors');
}

