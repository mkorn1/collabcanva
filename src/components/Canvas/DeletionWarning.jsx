import React, { memo } from 'react';
import { Group, Rect, Text as KonvaText } from 'react-konva';

/**
 * Visual warning component for objects with pending deletion intents
 */
const DeletionWarning = memo(({ object, deletionIntent, stageScale = 1 }) => {
  if (!deletionIntent) return null;

  const warningColor = '#ff6b6b';
  const warningSize = Math.max(20, 30 / stageScale); // Scale with zoom
  const fontSize = Math.max(10, 12 / stageScale);

  return (
    <Group>
      {/* Warning border around object */}
      <Rect
        x={object.x - 5}
        y={object.y - 5}
        width={(object.width || 100) + 10}
        height={(object.height || 100) + 10}
        fill="transparent"
        stroke={warningColor}
        strokeWidth={3}
        dash={[10, 5]}
        opacity={0.8}
      />
      
      {/* Warning icon and text */}
      <Group
        x={object.x + (object.width || 100) - warningSize}
        y={object.y - warningSize - 5}
      >
        {/* Warning badge background */}
        <Rect
          x={0}
          y={0}
          width={warningSize * 6}
          height={warningSize}
          fill="rgba(255, 107, 107, 0.9)"
          cornerRadius={warningSize / 2}
        />
        
        {/* Warning text */}
        <KonvaText
          x={warningSize * 0.3}
          y={warningSize * 0.15}
          text={`⚠️ ${deletionIntent.userName} wants to delete`}
          fontSize={fontSize}
          fill="white"
          fontFamily="Arial"
        />
      </Group>
    </Group>
  );
});

DeletionWarning.displayName = 'DeletionWarning';

export default DeletionWarning;
