// src/api/userApi.js
import apiClient from './apiClient';

export const saveUserInfo = async (userData) => {
  return await apiClient.post('/save-user', userData);
};

export const getUserInfoById = async (userId) => {
  return await apiClient.get(`/user/${userId}`);
};
