import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import './DarkModeToggle.css';

/**
 * Dark Mode Toggle Component
 * Provides a smooth toggle switch for dark/light mode
 */
const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="toggle-track">
        <div className={`toggle-thumb ${isDarkMode ? 'dark' : 'light'}`}>
          <span className="toggle-icon">
            {isDarkMode ? '🌙' : '☀️'}
          </span>
        </div>
      </div>
      <span className="toggle-label">
        {isDarkMode ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
