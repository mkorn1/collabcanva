// CursorLayer component for managing and rendering all user cursors
import { memo, useMemo } from 'react';
import { Layer } from 'react-konva';
import Cursor from './Cursor';

/**
 * CursorLayer component to render all other users' cursors on the canvas
 * @param {Object} props - Component props
 * @param {Array} props.onlineUsers - Array of online user objects with cursor data
 * @param {string} props.currentUserId - Current user's ID (to exclude from cursor display)
 * @param {number} props.scale - Canvas scale factor for responsive cursor sizing
 * @param {boolean} props.showCursors - Whether to show cursors (can be toggled off)
 * @param {Object} props.canvasBounds - Canvas boundaries {width, height} for cursor bounds checking
 * @param {Function} props.onCursorClick - Optional callback when a cursor is clicked
 * @returns {JSX.Element} CursorLayer component
 */
function CursorLayer({
  onlineUsers = [],
  currentUserId,
  scale = 1,
  showCursors = true,
  canvasBounds = { width: 4000, height: 4000 },
  onCursorClick = null
}) {
  // Filter out current user and prepare cursor data
  const otherUserCursors = useMemo(() => {
    if (!onlineUsers || !Array.isArray(onlineUsers)) {
      return [];
    }

    return onlineUsers
      .filter(user => {
        // Exclude current user
        if (currentUserId && user.id === currentUserId) {
          return false;
        }
        
        // Only include users with valid cursor data
        return user.cursorPosition && 
               typeof user.cursorPosition.x === 'number' && 
               typeof user.cursorPosition.y === 'number' &&
               user.cursorColor &&
               user.displayName;
      })
      .map(user => ({
        userId: user.id,
        displayName: user.displayName,
        cursorColor: user.cursorColor,
        x: user.cursorPosition.x,
        y: user.cursorPosition.y,
        isOnline: user.isOnline !== false, // Default to true if not specified
        lastSeen: user.lastSeen
      }));
  }, [onlineUsers, currentUserId]);

  // Check if cursor is within visible canvas bounds (with some padding for labels)
  const isCursorVisible = useMemo(() => {
    const padding = 100; // Extra padding for cursor labels that extend beyond cursor position
    
    return (cursor) => {
      return cursor.x >= -padding && 
             cursor.x <= canvasBounds.width + padding &&
             cursor.y >= -padding && 
             cursor.y <= canvasBounds.height + padding;
    };
  }, [canvasBounds]);

  // Filter cursors to only show those within visible bounds
  const visibleCursors = useMemo(() => {
    if (!showCursors) return [];
    
    return otherUserCursors.filter(cursor => isCursorVisible(cursor));
  }, [otherUserCursors, showCursors, isCursorVisible]);

  // Handle cursor click events
  const handleCursorClick = (cursor) => {
    if (onCursorClick && typeof onCursorClick === 'function') {
      onCursorClick(cursor);
    }
  };

  // Don't render layer if no cursors to show
  if (visibleCursors.length === 0) {
    return null;
  }

  return (
    <Layer
      listening={!!onCursorClick} // Only listen to events if click handler provided
    >
      {visibleCursors.map((cursor) => (
        <Cursor
          key={cursor.userId}
          userId={cursor.userId}
          displayName={cursor.displayName}
          cursorColor={cursor.cursorColor}
          x={cursor.x}
          y={cursor.y}
          showLabel={!cursor.isCurrentUser} // Hide label for current user's cursor
          isVisible={cursor.isOnline}
          scale={scale}
          onClick={onCursorClick ? () => handleCursorClick(cursor) : undefined}
        />
      ))}
    </Layer>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(CursorLayer, (prevProps, nextProps) => {
  // Deep comparison for onlineUsers array
  const usersChanged = (
    prevProps.onlineUsers?.length !== nextProps.onlineUsers?.length ||
    prevProps.onlineUsers?.some((user, index) => {
      const nextUser = nextProps.onlineUsers?.[index];
      return !nextUser ||
             user.id !== nextUser.id ||
             user.displayName !== nextUser.displayName ||
             user.cursorColor !== nextUser.cursorColor ||
             user.cursorPosition?.x !== nextUser.cursorPosition?.x ||
             user.cursorPosition?.y !== nextUser.cursorPosition?.y ||
             user.isOnline !== nextUser.isOnline;
    })
  );

  // Check other props
  const otherPropsChanged = (
    prevProps.currentUserId !== nextProps.currentUserId ||
    prevProps.scale !== nextProps.scale ||
    prevProps.showCursors !== nextProps.showCursors ||
    prevProps.canvasBounds?.width !== nextProps.canvasBounds?.width ||
    prevProps.canvasBounds?.height !== nextProps.canvasBounds?.height ||
    prevProps.onCursorClick !== nextProps.onCursorClick
  );

  // Only re-render if something actually changed
  return !usersChanged && !otherPropsChanged;
});

// Export named version for testing
export { CursorLayer };
