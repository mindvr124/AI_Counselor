// API 설정 탭
import React from 'react';

const ApiSettingsForm = ({ apiSettings, setApiSettings }) => {
  return (
    <div className="space-y-4">
      {/* 모델 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">모델</label>
        <select
          value={apiSettings.model}
          onChange={(e) => setApiSettings({ ...apiSettings, model: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o-mini</option>
          <option value="gpt-4.1">GPT-4.1</option>
          <option value="gpt-4.1-turbo">GPT-4.1 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Temperature: {apiSettings.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={apiSettings.temperature}
          onChange={(e) =>
            setApiSettings({ ...apiSettings, temperature: parseFloat(e.target.value) })
          }
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>보수적</span>
          <span>창의적</span>
        </div>
      </div>

      {/* 스트리밍 모드 */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={apiSettings.stream}
            onChange={(e) =>
              setApiSettings({ ...apiSettings, stream: e.target.checked })
            }
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">스트리밍 모드</span>
        </label>
      </div>
    </div>
  );
};

export default ApiSettingsForm;
