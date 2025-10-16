// Individual cursor component for displaying other users' cursors
import { memo } from 'react';
import { Group, Circle, Text, Arrow } from 'react-konva';
import { getContrastColor } from '../../utils/colors';

/**
 * Cursor component to display other users' cursors on the canvas
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID of the cursor owner
 * @param {string} props.displayName - Display name to show on the cursor
 * @param {string} props.cursorColor - Hex color for the cursor
 * @param {number} props.x - X position of the cursor
 * @param {number} props.y - Y position of the cursor
 * @param {boolean} props.showLabel - Whether to show the name label
 * @param {boolean} props.isVisible - Whether the cursor should be visible
 * @param {number} props.scale - Canvas scale factor for responsive sizing
 * @param {Function} props.onClick - Optional click handler for the cursor
 * @returns {JSX.Element} Cursor component
 */
function Cursor({
  userId,
  displayName,
  cursorColor = '#FF6B6B', // Default coral color
  x = 0,
  y = 0,
  showLabel = true,
  isVisible = true,
  scale = 1,
  onClick = null
}) {
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Calculate responsive sizes based on canvas scale
  const cursorSize = Math.max(8, 12 / scale); // Minimum 8px, scales down with zoom
  const labelPadding = Math.max(4, 8 / scale);
  const labelOffsetX = Math.max(8, 12 / scale);
  const labelOffsetY = Math.max(-4, -8 / scale);
  const fontSize = Math.max(10, 14 / scale);

  // Get contrasting text color for the label background
  const textColor = getContrastColor(cursorColor);

  // Truncate display name if too long
  const truncatedName = displayName && displayName.length > 20 
    ? displayName.substring(0, 17) + '...' 
    : displayName || 'User';

  return (
    <Group
      x={x}
      y={y}
      listening={!!onClick} // Listen to events only if onClick handler provided
      onClick={onClick}
    >
      {/* Cursor pointer/arrow */}
      <Arrow
        points={[0, 0, 0, cursorSize * 1.5, cursorSize, cursorSize * 0.5]}
        fill={cursorColor}
        stroke="#FFFFFF"
        strokeWidth={1 / scale}
        closed={true}
        listening={false}
      />

      {/* Cursor dot/center point */}
      <Circle
        x={cursorSize * 0.3}
        y={cursorSize * 0.6}
        radius={cursorSize * 0.2}
        fill="#FFFFFF"
        stroke={cursorColor}
        strokeWidth={0.5 / scale}
        listening={false}
      />

      {/* Name label */}
      {showLabel && (
        <Group
          x={labelOffsetX}
          y={labelOffsetY}
          listening={false}
        >
          {/* Label background */}
          <Text
            text={truncatedName}
            fontSize={fontSize}
            fontFamily="Arial, sans-serif"
            fill={cursorColor}
            padding={labelPadding}
            cornerRadius={labelPadding / 2}
            listening={false}
            // Add subtle shadow effect
            shadowColor="rgba(0, 0, 0, 0.2)"
            shadowBlur={2 / scale}
            shadowOffset={{ x: 1 / scale, y: 1 / scale }}
          />
          
          {/* Label text */}
          <Text
            text={truncatedName}
            fontSize={fontSize}
            fontFamily="Arial, sans-serif"
            fill={textColor}
            padding={labelPadding}
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
}

// Memoize to prevent unnecessary re-renders when other cursors change
export default memo(Cursor, (prevProps, nextProps) => {
  // Only re-render if relevant props have changed
  return (
    prevProps.userId === nextProps.userId &&
    prevProps.displayName === nextProps.displayName &&
    prevProps.cursorColor === nextProps.cursorColor &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.showLabel === nextProps.showLabel &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.scale === nextProps.scale &&
    prevProps.onClick === nextProps.onClick
  );
});

// Export named version for testing
export { Cursor };
