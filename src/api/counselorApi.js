// src/api/counselorApi.js
import apiClient from './apiClient';

export const fetchCounselorById = async (id) => {
  return await apiClient.get(`/counselors/${id}`);
};

export const updateCounselorById = async (id, updatedData) => {
  return await apiClient.put(`/counselors/${id}`, updatedData);
};

export const createCounselor = async (counselorData) => {
  return await apiClient.post('/counselors', counselorData);
};