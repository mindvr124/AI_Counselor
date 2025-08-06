import React from 'react';

const CounselorInfoForm = ({ counselorInfo, setCounselorInfo, loadCounselorInfo, isConnected }) => {
  
  // // counselorInfo가 undefined인 경우 처리
  // if (!counselorInfo || !counselorInfo.id) {
  //   return <div>상담사 정보를 불러오지 못했습니다. ID를 입력하고 '로드'를 눌러주세요.</div>;
  // }

  return (
    <div className="space-y-4">
      {/* 상담가 ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상담가 ID</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={counselorInfo?.id || ''}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상담 코드</label>
        <input
          type="text"
          value={counselorInfo?.code || ''}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="ex) 서윤's CODE : SANGDAM01"
        />
      </div>

      {/* 이름 + 나이 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            type="text"
            value={counselorInfo?.name || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">나이</label>
          <input
            type="text"
            value={counselorInfo?.age || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, age: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* 성별 + 직업 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
          <select
            value={counselorInfo?.gender || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">선택하세요</option>
            <option value="남성">남성</option>
            <option value="여성">여성</option>
            <option value="없음">없음</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">직업</label>
          <input
            type="text"
            value={counselorInfo?.job || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, job: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      {/* 취미 + 경력 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">취미</label>
          <input
            type="text"
            value={counselorInfo?.hobby || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, hobby: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
          <input
            type="text"
            value={counselorInfo?.career || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, career: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="예: 10년차 임상심리사"
          />
        </div>
      </div>

      {/* 배경 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">배경 이야기</label>
        <textarea
          value={counselorInfo?.background || ''}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, background: e.target.value })}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 어릴 적 가정 폭력을 겪음, 큰 사고를 당해 신체적/정신적 후유증이 있음."
        />
      </div>

      {/* 성격 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">성격</label>
        <input
          value={counselorInfo?.personality || ''}
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
          value={counselorInfo?.speaking_style || ''}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, speaking_style: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 따뜻하고 친근한, 전문적이고 차분한"
        />
      </div>

      {/* 특징 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">특징</label>
        <input
          type="text"
          value={counselorInfo?.feature || ''}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, feature: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: “헉…”, “음…” 과 같은 감탄사나 추임새를 자주 사용함"
        />
      </div>

      {/* 전문 분야 + 주요 상담 연령대*/}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전문 분야</label>
          <input
            type="text"
            value={counselorInfo?.specialties || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, specialties: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="예: 우울증, 불안장애, 인간관계"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">주요 상담 연령대</label>
          <input
            type="text"
            value={counselorInfo?.main_age_group || ''}
            onChange={(e) => setCounselorInfo({ ...counselorInfo, main_age_group: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="예: 청소년, 어린이, 성인, 노인"
          />
        </div>
      </div>

      {/* 상담 방법 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">상담 방법</label>
        <textarea
          value={counselorInfo?.counseling_method || ''}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, counseling_method: e.target.value })}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 인지행동치료, 마음챙김 기법 활용"
        />
      </div>

      {/* 한 줄 소개 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">한 줄 소개</label>
        <textarea
          value={counselorInfo?.summary || ''}
          onChange={(e) => setCounselorInfo({ ...counselorInfo, summary: e.target.value })}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="예: 불안한 마음을 편안하게 다독이는 엄마 같은 상담가 #정서적지지 #심리안정 #편안한상담"
        />
      </div>
    </div>
  );
};

export default CounselorInfoForm;
