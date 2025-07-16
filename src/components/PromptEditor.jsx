import React, { useEffect } from 'react';
const PromptEditor = ({ systemPrompt, setSystemPrompt }) => {
  useEffect(() => {
    console.log("PromptEditor에서 받은 systemPrompt:", systemPrompt);
  }, [systemPrompt]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">시스템 프롬프트</label>
      <textarea
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        rows="20"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        placeholder="시스템 프롬프트를 입력하세요..."
      />
    </div>
  );
};

export default PromptEditor;