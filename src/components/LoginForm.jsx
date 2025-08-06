// src/components/LoginForm.jsx
import React, { useState } from 'react';
import { login } from '../api/authApi';

const LoginForm = ({ onLoginSuccess }) => {
  const [user_id, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login(user_id, password);
      const token = res.data.data?.token;
      console.log('✅ 로그인 성공:', token);
      onLoginSuccess(token); // => AICounselor에서 토큰 저장 및 사용자 정보 요청
    } catch (err) {
      console.error('❌ 로그인 실패:', err);
      alert('로그인 실패: 아이디나 비밀번호를 확인하세요.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm">아이디</label>
        <input
          type="text"
          value={user_id}
          onChange={e => setUserId(e.target.value)}
          placeholder="아이디를 입력하세요"
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <div>
        <label className="block text-sm">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          className="w-full border px-3 py-2 rounded"
        />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
        로그인
      </button>
    </form>
  );
};

const styles = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px',
  },
};

export default LoginForm;
