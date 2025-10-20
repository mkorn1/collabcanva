import React, { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Context Menu Component for right-click interactions
 * Provides a floating menu with various options including layer position editing
 */
const ContextMenu = ({
  isVisible = false,
  position = { x: 0, y: 0 },
  targetObject = null,
  onClose = null,
  onLayerPositionEdit = null,
  onDelete = null,
  onDuplicate = null,
  onBringToFront = null,
  onSendToBack = null
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef(null);

  // Menu items configuration
  const menuItems = [
    {
      id: 'layer-position',
      label: 'Layer Position',
      icon: '📚',
      shortcut: 'L',
      action: onLayerPositionEdit,
      disabled: !targetObject
    },
    {
      id: 'bring-to-front',
      label: 'Bring to Front',
      icon: '⬆️',
      shortcut: 'F',
      action: onBringToFront,
      disabled: !targetObject
    },
    {
      id: 'send-to-back',
      label: 'Send to Back',
      icon: '⬇️',
      shortcut: 'B',
      action: onSendToBack,
      disabled: !targetObject
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: '📋',
      shortcut: 'D',
      action: onDuplicate,
      disabled: !targetObject
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      shortcut: 'Del',
      action: onDelete,
      disabled: !targetObject,
      destructive: true
    }
  ];

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (!isVisible) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => {
          const nextIndex = prev + 1;
          return nextIndex >= menuItems.length ? 0 : nextIndex;
        });
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => {
          const prevIndex = prev - 1;
          return prevIndex < 0 ? menuItems.length - 1 : prevIndex;
        });
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < menuItems.length) {
          const item = menuItems[focusedIndex];
          if (!item.disabled && item.action) {
            item.action();
          }
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        if (onClose) {
          onClose();
        }
        break;
      
      // Handle shortcut keys
      case 'l':
      case 'L':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (onLayerPositionEdit) {
            onLayerPositionEdit();
          }
        }
        break;
      
      case 'f':
      case 'F':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (onBringToFront) {
            onBringToFront();
          }
        }
        break;
      
      case 'b':
      case 'B':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (onSendToBack) {
            onSendToBack();
          }
        }
        break;
      
      case 'd':
      case 'D':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (onDuplicate) {
            onDuplicate();
          }
        }
        break;
      
      case 'Delete':
        event.preventDefault();
        if (onDelete) {
          onDelete();
        }
        break;
      
      default:
        break;
    }
  }, [isVisible, focusedIndex, menuItems, onClose, onLayerPositionEdit, onBringToFront, onSendToBack, onDuplicate, onDelete]);

  // Handle click outside to close menu
  const handleClickOutside = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      if (onClose) {
        onClose();
      }
    }
  }, [onClose]);

  // Set up event listeners
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
      
      // Focus the menu when it becomes visible
      if (menuRef.current) {
        menuRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isVisible, handleKeyDown, handleClickOutside]);

  // Reset focus when menu becomes visible
  useEffect(() => {
    if (isVisible) {
      setFocusedIndex(-1);
    }
  }, [isVisible]);

  // Handle menu item click
  const handleItemClick = (item) => {
    if (!item.disabled && item.action) {
      item.action();
    }
  };

  // Handle menu item mouse enter for keyboard navigation
  const handleItemMouseEnter = (index) => {
    setFocusedIndex(index);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[1000] bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 dark:bg-gray-700/95 dark:border-gray-600"
      style={{
        left: position.x,
        top: position.y,
        maxWidth: '300px'
      }}
      role="menu"
      aria-label="Context menu"
      tabIndex={-1}
    >
      {/* Header with object info */}
      {targetObject && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {targetObject.type?.charAt(0).toUpperCase() + targetObject.type?.slice(1)} Object
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Layer: {targetObject.layerPosition || 0}
          </div>
        </div>
      )}

      {/* Menu items */}
      {menuItems.map((item, index) => (
        <button
          key={item.id}
          onClick={() => handleItemClick(item)}
          onMouseEnter={() => handleItemMouseEnter(index)}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors duration-200 ${
            focusedIndex === index
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : item.disabled
              ? 'text-gray-400 cursor-not-allowed dark:text-gray-600'
              : item.destructive
              ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
          disabled={item.disabled}
          role="menuitem"
          aria-label={item.label}
        >
          <span className="text-base" aria-hidden="true">
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
          {item.shortcut && (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {item.shortcut}
            </span>
          )}
        </button>
      ))}

      {/* Footer with help text */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  );
};

export default ContextMenu;
