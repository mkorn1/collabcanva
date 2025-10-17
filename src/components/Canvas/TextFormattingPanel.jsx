import React from 'react';
import './TextFormattingPanel.css';

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
    <div className="text-formatting-panel">
      <div className="panel-header">
        <h3>Text Formatting</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="panel-section">
        <label>Font Family</label>
        <select
          value={textObject.fontFamily || 'Arial'}
          onChange={(e) => onChange({ ...textObject, fontFamily: e.target.value })}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
          <option value="Inter">Inter</option>
          <option value="Roboto">Roboto</option>
        </select>
      </div>

      <div className="panel-section">
        <label>Font Size</label>
        <div className="font-size-controls">
          <button onClick={() => handleFontSizeChange(-2)} title="Decrease font size">-</button>
          <input
            type="number"
            value={Math.round(textObject.fontSize || 16)}
            onChange={(e) => {
              const size = parseInt(e.target.value) || 16;
              onChange({ ...textObject, fontSize: Math.max(8, Math.min(200, size)) });
            }}
            min="8"
            max="200"
          />
          <button onClick={() => handleFontSizeChange(2)} title="Increase font size">+</button>
        </div>
      </div>

      <div className="panel-section">
        <label>Style</label>
        <div className="style-buttons">
          <button
            className={isBold ? 'active' : ''}
            onClick={toggleBold}
            title="Bold (Cmd+B)"
          >
            <strong>B</strong>
          </button>
          <button
            className={isItalic ? 'active' : ''}
            onClick={toggleItalic}
            title="Italic (Cmd+I)"
          >
            <em>I</em>
          </button>
        </div>
      </div>

      <div className="panel-section">
        <label>Text Color</label>
        <div className="color-input-wrapper">
          <input
            type="color"
            value={textObject.fill || '#000000'}
            onChange={(e) => onChange({ ...textObject, fill: e.target.value })}
          />
          <input
            type="text"
            value={textObject.fill || '#000000'}
            onChange={(e) => onChange({ ...textObject, fill: e.target.value })}
            placeholder="#000000"
            className="color-text-input"
          />
        </div>
      </div>

      <div className="panel-section">
        <label>Alignment</label>
        <div className="alignment-buttons">
          <button
            className={(!textObject.align || textObject.align === 'left') ? 'active' : ''}
            onClick={() => onChange({ ...textObject, align: 'left' })}
            title="Align Left"
          >
            ⬅
          </button>
          <button
            className={textObject.align === 'center' ? 'active' : ''}
            onClick={() => onChange({ ...textObject, align: 'center' })}
            title="Align Center"
          >
            ⬌
          </button>
          <button
            className={textObject.align === 'right' ? 'active' : ''}
            onClick={() => onChange({ ...textObject, align: 'right' })}
            title="Align Right"
          >
            ➡
          </button>
        </div>
      </div>

      <div className="panel-section">
        <label>Line Height</label>
        <div className="range-control">
          <input
            type="range"
            min="0.8"
            max="2.5"
            step="0.1"
            value={textObject.lineHeight || 1}
            onChange={(e) => onChange({ ...textObject, lineHeight: parseFloat(e.target.value) })}
          />
          <span className="range-value">{(textObject.lineHeight || 1).toFixed(1)}</span>
        </div>
      </div>

      <div className="panel-section">
        <label>Letter Spacing</label>
        <div className="range-control">
          <input
            type="range"
            min="-5"
            max="20"
            step="1"
            value={textObject.letterSpacing || 0}
            onChange={(e) => onChange({ ...textObject, letterSpacing: parseInt(e.target.value) })}
          />
          <span className="range-value">{textObject.letterSpacing || 0}px</span>
        </div>
      </div>

      <div className="panel-section">
        <label>Text Content</label>
        <textarea
          value={textObject.text || ''}
          onChange={(e) => onChange({ ...textObject, text: e.target.value })}
          placeholder="Enter text..."
          rows={3}
        />
      </div>
    </div>
  );
};

export default TextFormattingPanel;
