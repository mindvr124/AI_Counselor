import React from 'react';

const CounselorInfoForm = ({ counselorInfo, setCounselorInfo, loadCounselorInfo, isConnected }) => {
  return (
    <div className="space-y-4">
      {/* 상담가 ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상담가 ID</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={counselorInfo.id}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, id: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            placeholder="상담가 ID 입력"
          />
          <button
            onClick={() => loadCounselorInfo(counselorInfo.id)}
            disabled={!isConnected}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            로드
          </button>
        </div>
      </div>

      {/* 이름 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <input
          type="text"
          value={counselorInfo.name}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* 성별 + 나이 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
          <select
            value={counselorInfo.gender}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">선택하세요</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
          <input
            type="text"
            value={counselorInfo.age}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, age: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* 성격 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">성격</label>
        <textarea
          value={counselorInfo.personality}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, personality: e.target.value })}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 따뜻하고 공감적인, 차분하고 신중한"
        />
      </div>

      {/* 말투 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">말투</label>
        <input
          type="text"
          value={counselorInfo.tone}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, tone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 따뜻하고 친근한, 전문적이고 차분한"
        />
      </div>

      {/* 전문 분야 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">전문 분야</label>
        <input
          type="text"
          value={counselorInfo.specialty}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, specialty: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 우울증, 불안장애, 인간관계"
        />
      </div>

      {/* 경력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
        <input
          type="text"
          value={counselorInfo.career}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, career: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 10년차 임상심리사"
        />
      </div>

      {/* 상담 방법 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상담 방법</label>
        <textarea
          value={counselorInfo.method}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, method: e.target.value })}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 인지행동치료, 마음챙김 기법 활용"
        />
      </div>
    </div>
  );
};

export default CounselorInfoForm;
