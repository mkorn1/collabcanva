import React from 'react';

/**
 * Text formatting panel for advanced text editing
 * Shows when a text object is selected
 */
const TextFormattingPanel = ({ textObject, onChange, onClose }) => {
  if (!textObject || textObject.type !== 'text') return null;

  const handleFontSizeChange = (delta) => {
    const newSize = Math.max(8, Math.min(200, (textObject.fontSize || 16) + delta));
    onChange({ ...textObject, fontSize: newSize });
  };

  const toggleBold = () => {
    const currentStyle = textObject.fontStyle || '';
    const isBold = currentStyle.includes('bold');
    let newStyle = currentStyle.replace('bold', '').trim();
    if (!isBold) {
      newStyle = newStyle ? `${newStyle} bold` : 'bold';
    }
    onChange({ ...textObject, fontStyle: newStyle });
  };

  const toggleItalic = () => {
    const currentStyle = textObject.fontStyle || '';
    const isItalic = currentStyle.includes('italic');
    let newStyle = currentStyle.replace('italic', '').trim();
    if (!isItalic) {
      newStyle = newStyle ? `${newStyle} italic` : 'italic';
    }
    onChange({ ...textObject, fontStyle: newStyle });
  };

  const isBold = (textObject.fontStyle || '').includes('bold');
  const isItalic = (textObject.fontStyle || '').includes('italic');

  return (
    <div className="fixed top-20 right-5 w-80 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-4 z-[200] dark:bg-gray-700/95 dark:border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Text Formatting</h3>
        <button 
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-600"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Font Family</label>
          <select
            value={textObject.fontFamily || 'Arial'}
            onChange={(e) => onChange({ ...textObject, fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
            <option value="Monaco">Monaco</option>
            <option value="Menlo">Menlo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Font Size</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFontSizeChange(-2)}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
            >
              A-
            </button>
            <input
              type="number"
              value={textObject.fontSize || 16}
              onChange={(e) => onChange({ ...textObject, fontSize: parseInt(e.target.value) || 16 })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
              min="8"
              max="200"
            />
            <button
              onClick={() => handleFontSizeChange(2)}
              className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200"
            >
              A+
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Style</label>
          <div className="flex gap-2">
            <button
              onClick={toggleBold}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isBold 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              Bold
            </button>
            <button
              onClick={toggleItalic}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isItalic 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
              }`}
            >
              Italic
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Text Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textObject.fill || '#000000'}
              onChange={(e) => onChange({ ...textObject, fill: e.target.value })}
              className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={textObject.fill || '#000000'}
              onChange={(e) => onChange({ ...textObject, fill: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
              placeholder="#000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Text Content</label>
          <textarea
            value={textObject.text || ''}
            onChange={(e) => onChange({ ...textObject, text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
            rows="3"
            placeholder="Enter text..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Alignment</label>
          <div className="flex gap-2">
            {['left', 'center', 'right'].map((align) => (
              <button
                key={align}
                onClick={() => onChange({ ...textObject, align })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 capitalize ${
                  textObject.align === align
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextFormattingPanel;