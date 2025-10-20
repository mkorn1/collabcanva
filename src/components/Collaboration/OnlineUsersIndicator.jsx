import React, { useState } from 'react';

/**
 * Online Users Indicator Component
 * Displays online users as circles in the header, similar to Google Docs/Sheets
 * Shows user initials or avatars with their cursor colors
 */
const OnlineUsersIndicator = ({ 
  onlineUsers = [], 
  currentUserId = null,
  maxVisible = 5 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoveredUser, setHoveredUser] = useState(null);

  // Show all users including current user, limit visible users
  const allUsers = onlineUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, onlineUsers.length - maxVisible);

  // Generate initials from display name or email
  const getInitials = (user) => {
    const name = user.displayName || user.email || 'Anonymous';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle user circle hover
  const handleUserHover = (user) => {
    setHoveredUser(user);
    setShowTooltip(true);
  };

  const handleUserLeave = () => {
    setHoveredUser(null);
    setShowTooltip(false);
  };

  if (onlineUsers.length === 0) {
    return null; // Don't show if no users are online
  }

  return (
    <div className="relative flex items-center gap-1 online-users-indicator">
      {/* User circles */}
      <div className="flex items-center -space-x-1">
        {allUsers.map((user, index) => (
          <div
            key={user.id}
            className="relative"
            onMouseEnter={() => handleUserHover(user)}
            onMouseLeave={handleUserLeave}
          >
            <div
              className="user-circle"
              style={{ 
                backgroundColor: user.cursorColor,
                zIndex: allUsers.length - index
              }}
              title={`${user.displayName || user.email}${user.id === currentUserId ? ' (You)' : ''} (${user.cursorColor})`}
            >
              {getInitials(user)}
            </div>
          </div>
        ))}
        
        {/* Remaining count indicator */}
        {remainingCount > 0 && (
          <div
            className="remaining-count"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            title={`${remainingCount} more user${remainingCount > 1 ? 's' : ''}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && hoveredUser && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 whitespace-nowrap">
          <div className="font-medium">{hoveredUser.displayName || hoveredUser.email}{hoveredUser.id === currentUserId ? ' (You)' : ''}</div>
          <div className="text-xs text-gray-300">Online</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Tooltip for remaining count */}
      {showTooltip && !hoveredUser && remainingCount > 0 && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg z-50 whitespace-nowrap">
          <div className="font-medium">{remainingCount} more user{remainingCount > 1 ? 's' : ''}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersIndicator;
