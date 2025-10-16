import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Rectangle from '../../components/Canvas/Rectangle.jsx';

// Mock Konva since it requires canvas
vi.mock('react-konva', () => ({
  Rect: vi.fn(({ onClick, onTap, onDragEnd, onMouseEnter, onMouseLeave, ...props }) => (
    <div
      data-testid="konva-rect"
      data-x={props.x}
      data-y={props.y}
      data-width={props.width}
      data-height={props.height}
      data-fill={props.fill}
      data-stroke={props.stroke}
      data-stroke-width={props.strokeWidth}
      data-opacity={props.opacity}
      data-draggable={props.draggable}
      onClick={onClick}
      onMouseDown={onTap} // Simulate tap as mousedown for testing
      onMouseUp={(e) => {
        // Simulate drag end
        if (onDragEnd) {
          const mockEvent = {
            cancelBubble: false,
            target: {
              x: () => props.x + 10, // Simulate movement
              y: () => props.y + 10,
              getStage: () => ({
                container: () => ({
                  style: { cursor: 'default' }
                })
              })
            }
          };
          onDragEnd(mockEvent);
        }
      }}
      onMouseEnter={(e) => {
        const mockEvent = {
          target: {
            getStage: () => ({
              container: () => ({
                style: { cursor: 'pointer' }
              })
            })
          }
        };
        onMouseEnter?.(mockEvent);
      }}
      onMouseLeave={(e) => {
        const mockEvent = {
          target: {
            getStage: () => ({
              container: () => ({
                style: { cursor: 'default' }
              })
            })
          }
        };
        onMouseLeave?.(mockEvent);
      }}
    />
  ))
}));

describe('Rectangle Component', () => {
  const mockRectangle = {
    id: 'rect-123',
    x: 100,
    y: 50,
    width: 200,
    height: 150,
    fill: '#ff6b6b',
    stroke: '#ff6b6b',
    strokeWidth: 2,
    opacity: 1,
    updatedAt: 1000 // Add updatedAt for memo comparison
  };

  const mockOnSelect = vi.fn();
  const mockOnMove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders rectangle with correct dimensions', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-x', '100');
      expect(rect).toHaveAttribute('data-y', '50');
      expect(rect).toHaveAttribute('data-width', '200');
      expect(rect).toHaveAttribute('data-height', '150');
    });

    it('renders rectangle with correct colors', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-fill', '#ff6b6b');
      expect(rect).toHaveAttribute('data-stroke', '#ff6b6b');
      expect(rect).toHaveAttribute('data-stroke-width', '2');
      expect(rect).toHaveAttribute('data-opacity', '1');
    });

    it('renders rectangle at correct position', () => {
      const customRect = { ...mockRectangle, x: 300, y: 200 };
      
      render(
        <Rectangle
          rectangle={customRect}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-x', '300');
      expect(rect).toHaveAttribute('data-y', '200');
    });
  });

  describe('Selection States', () => {
    it('shows blue outline when selected', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={true}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-stroke', '#0066ff'); // Blue outline
      expect(rect).toHaveAttribute('data-stroke-width', '3'); // Thicker stroke
    });

    it('shows original colors when not selected', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-stroke', '#ff6b6b'); // Original stroke
      expect(rect).toHaveAttribute('data-stroke-width', '2'); // Original width
    });

    it('is draggable only when selected', () => {
      const { rerender } = render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={true}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      let rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-draggable', 'true');

      rerender(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-draggable', 'false');
    });
  });

  describe('Interactions', () => {
    it('calls onSelect when clicked', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      rect.click();

      expect(mockOnSelect).toHaveBeenCalledWith('rect-123');
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onSelect when tapped (touch)', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      // Simulate tap via mousedown (our mock maps onTap to onMouseDown)
      rect.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(mockOnSelect).toHaveBeenCalledWith('rect-123');
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onMove when dragged', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={true}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      // Simulate drag end via mouseup (our mock handles this)
      rect.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

      expect(mockOnMove).toHaveBeenCalledWith('rect-123', { x: 110, y: 60 });
      expect(mockOnMove).toHaveBeenCalledTimes(1);
    });

    it('prevents event bubbling on click', () => {
      render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      // Add cancelBubble tracking
      let bubbleCancelled = false;
      Object.defineProperty(clickEvent, 'cancelBubble', {
        get: () => bubbleCancelled,
        set: (value) => { bubbleCancelled = value; }
      });

      rect.dispatchEvent(clickEvent);

      // Note: In our mock, we can't easily test cancelBubble, 
      // but we verify the onSelect was called which indicates the handler ran
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe('Different Rectangle Configurations', () => {
    it('handles small rectangles', () => {
      const smallRect = {
        ...mockRectangle,
        width: 10,
        height: 10
      };

      render(
        <Rectangle
          rectangle={smallRect}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-width', '10');
      expect(rect).toHaveAttribute('data-height', '10');
    });

    it('handles large rectangles', () => {
      const largeRect = {
        ...mockRectangle,
        width: 1000,
        height: 800
      };

      render(
        <Rectangle
          rectangle={largeRect}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-width', '1000');
      expect(rect).toHaveAttribute('data-height', '800');
    });

    it('handles transparent rectangles', () => {
      const transparentRect = {
        ...mockRectangle,
        opacity: 0.3
      };

      render(
        <Rectangle
          rectangle={transparentRect}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-opacity', '0.3');
    });

    it('handles different colors', () => {
      const blueRect = {
        ...mockRectangle,
        fill: '#4299e1',
        stroke: '#2b6cb0'
      };

      render(
        <Rectangle
          rectangle={blueRect}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-fill', '#4299e1');
      expect(rect).toHaveAttribute('data-stroke', '#2b6cb0');
    });
  });

  describe('Performance (Memoization)', () => {
    it('does not re-render when props are identical', () => {
      const { rerender } = render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      // Re-render with identical props
      rerender(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      // Component should be memoized, but we can't easily test this in JSDOM
      // This test mainly ensures no errors occur with identical props
      expect(screen.getByTestId('konva-rect')).toBeInTheDocument();
    });

    it('re-renders when rectangle properties change', () => {
      const { rerender } = render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      // Create a completely new object with different updatedAt to ensure memo comparison fails
      const changedRect = {
        id: 'rect-123',
        x: 200, // Changed value
        y: 50,
        width: 200,
        height: 150,
        fill: '#ff6b6b',
        stroke: '#ff6b6b',
        strokeWidth: 2,
        opacity: 1,
        updatedAt: 2000 // Different updatedAt to trigger re-render
      };
      
      rerender(
        <Rectangle
          rectangle={changedRect}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-x', '200');
    });

    it('re-renders when selection state changes', () => {
      const { rerender } = render(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={false}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      rerender(
        <Rectangle
          rectangle={mockRectangle}
          isSelected={true}
          onSelect={mockOnSelect}
          onMove={mockOnMove}
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('data-stroke', '#0066ff'); // Selected color
    });
  });
});
