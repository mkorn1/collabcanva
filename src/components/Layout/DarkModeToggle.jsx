import React from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';

/**
 * Dark Mode Toggle Component
 * Provides a smooth toggle switch for dark/light mode
 */
const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full bg-white cursor-pointer transition-all duration-300 ease-out text-sm font-medium text-gray-600 select-none outline-none hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-2 focus:outline-primary-500 focus:outline-offset-2 active:translate-y-0 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:border-gray-500"
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-9 h-5 bg-gray-200 rounded-xl transition-colors duration-300 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center transition-all duration-300 ease-out shadow-sm ${isDarkMode ? 'left-4.5' : 'left-0.5'}`}>
          <span className="text-xs leading-none transition-transform duration-300">
            {isDarkMode ? '🌙' : '☀️'}
          </span>
        </div>
      </div>
      <span className="text-xs font-medium min-w-8 text-left">
        {isDarkMode ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
