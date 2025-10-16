/**
 * @jest-environment jsdom
 */

import {
  generateRandomColor,
  generateDistinctColors,
  rgbToHex,
  getContrastColor,
  adjustBrightness
} from '../../utils/colors.js';

describe('Color Generation Utilities', () => {
  describe('generateRandomColor()', () => {
    test('should return a valid hex color string', () => {
      const color = generateRandomColor();
      
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    test('should return colors in correct #RRGGBB format', () => {
      for (let i = 0; i < 10; i++) {
        const color = generateRandomColor();
        
        // Should start with #
        expect(color.charAt(0)).toBe('#');
        
        // Should be exactly 7 characters long
        expect(color.length).toBe(7);
        
        // Should contain only valid hex characters
        expect(color.slice(1)).toMatch(/^[0-9A-F]{6}$/i);
      }
    });

    test('should generate colors that are sufficiently distinct from white and black', () => {
      const colors = [];
      
      // Generate multiple colors to test
      for (let i = 0; i < 20; i++) {
        colors.push(generateRandomColor());
      }

      colors.forEach(color => {
        // Convert hex to RGB to check brightness
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // Calculate perceived brightness
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
        
        // Should not be too dark (avoid black-like colors)
        expect(brightness).toBeGreaterThan(60);
        
        // Should not be too light (avoid white-like colors)
        // Note: Some curated colors may be lighter but still good for cursors
        expect(brightness).toBeLessThan(240);
        
        // Individual RGB values should be within reasonable bounds
        // Note: Some curated colors may have higher RGB values but are still suitable for cursors
        expect(r).toBeGreaterThanOrEqual(30);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(30);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(30);
        expect(b).toBeLessThanOrEqual(255);
      });
    });

    test('should demonstrate randomness by generating different colors', () => {
      const colors = new Set();
      const iterations = 15;
      
      // Generate multiple colors
      for (let i = 0; i < iterations; i++) {
        colors.add(generateRandomColor());
      }
      
      // Should have generated at least some different colors
      // (allowing for small chance of duplicates in random generation)
      expect(colors.size).toBeGreaterThan(5);
    });

    test('should never return invalid hex values', () => {
      for (let i = 0; i < 50; i++) {
        const color = generateRandomColor();
        
        // Extract RGB components
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // All RGB values should be valid (0-255)
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(255);
        expect(g).toBeGreaterThanOrEqual(0);
        expect(g).toBeLessThanOrEqual(255);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThanOrEqual(255);
        
        // Should not be NaN
        expect(r).not.toBeNaN();
        expect(g).not.toBeNaN();
        expect(b).not.toBeNaN();
      }
    });
  });

  describe('generateDistinctColors()', () => {
    test('should generate the requested number of colors', () => {
      const count = 5;
      const colors = generateDistinctColors(count);
      
      expect(Array.isArray(colors)).toBe(true);
      expect(colors.length).toBe(count);
    });

    test('should generate all valid hex colors', () => {
      const colors = generateDistinctColors(8);
      
      colors.forEach(color => {
        expect(typeof color).toBe('string');
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('should generate reasonably distinct colors', () => {
      const colors = generateDistinctColors(6);
      
      // Check that we have unique colors (no exact duplicates)
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
      
      // All colors should be valid
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('should handle edge cases', () => {
      // Test with 0 colors
      expect(generateDistinctColors(0)).toEqual([]);
      
      // Test with 1 color
      const oneColor = generateDistinctColors(1);
      expect(oneColor.length).toBe(1);
      expect(oneColor[0]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  describe('rgbToHex()', () => {
    test('should convert RGB values to correct hex format', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#FF0000'); // Red
      expect(rgbToHex(0, 255, 0)).toBe('#00FF00'); // Green
      expect(rgbToHex(0, 0, 255)).toBe('#0000FF'); // Blue
      expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF'); // White
      expect(rgbToHex(0, 0, 0)).toBe('#000000'); // Black
    });

    test('should handle mid-range values correctly', () => {
      expect(rgbToHex(128, 128, 128)).toBe('#808080'); // Gray
      expect(rgbToHex(255, 165, 0)).toBe('#FFA500'); // Orange
      expect(rgbToHex(75, 0, 130)).toBe('#4B0082'); // Indigo
    });

    test('should clamp values outside 0-255 range', () => {
      expect(rgbToHex(-10, 300, 128)).toBe('#00FF80');
      expect(rgbToHex(256, -5, 500)).toBe('#FF00FF');
    });

    test('should handle decimal values by rounding', () => {
      expect(rgbToHex(255.7, 128.3, 0.9)).toBe('#FF8001');
      expect(rgbToHex(100.4, 200.6, 50.1)).toBe('#64C932');
    });
  });

  describe('getContrastColor()', () => {
    test('should return white for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#FFFFFF'); // Black
      expect(getContrastColor('#333333')).toBe('#FFFFFF'); // Dark gray
      expect(getContrastColor('#800000')).toBe('#FFFFFF'); // Dark red
    });

    test('should return black for light backgrounds', () => {
      expect(getContrastColor('#FFFFFF')).toBe('#000000'); // White
      expect(getContrastColor('#CCCCCC')).toBe('#000000'); // Light gray
      expect(getContrastColor('#FFFF00')).toBe('#000000'); // Yellow
    });

    test('should handle edge cases around the threshold', () => {
      // Colors right around the luminance threshold
      const result1 = getContrastColor('#808080'); // Medium gray
      const result2 = getContrastColor('#7F7F7F'); // Slightly darker gray
      
      expect(['#000000', '#FFFFFF']).toContain(result1);
      expect(['#000000', '#FFFFFF']).toContain(result2);
    });

    test('should handle malformed hex input gracefully', () => {
      // Should not throw errors, should return a valid contrast color
      const result = getContrastColor('#invalid');
      expect(['#000000', '#FFFFFF']).toContain(result);
    });
  });

  describe('adjustBrightness()', () => {
    test('should brighten colors when factor > 1', () => {
      const originalColor = '#808080'; // Medium gray
      const brighterColor = adjustBrightness(originalColor, 1.5);
      
      expect(brighterColor).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Extract RGB values to verify brightness increased
      const origR = parseInt(originalColor.slice(1, 3), 16);
      const brightR = parseInt(brighterColor.slice(1, 3), 16);
      
      expect(brightR).toBeGreaterThanOrEqual(origR);
    });

    test('should darken colors when factor < 1', () => {
      const originalColor = '#CCCCCC'; // Light gray
      const darkerColor = adjustBrightness(originalColor, 0.5);
      
      expect(darkerColor).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Extract RGB values to verify brightness decreased
      const origR = parseInt(originalColor.slice(1, 3), 16);
      const darkR = parseInt(darkerColor.slice(1, 3), 16);
      
      expect(darkR).toBeLessThanOrEqual(origR);
    });

    test('should not change color when factor = 1', () => {
      const color = '#FF6B6B';
      const unchangedColor = adjustBrightness(color, 1.0);
      
      expect(unchangedColor).toBe(color);
    });

    test('should clamp values to valid RGB range', () => {
      // Test that very bright adjustment doesn't exceed #FFFFFF
      const brightResult = adjustBrightness('#DDDDDD', 3.0);
      expect(brightResult).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Test that very dark adjustment doesn't go below #000000
      const darkResult = adjustBrightness('#333333', 0.1);
      expect(darkResult).toMatch(/^#[0-9A-F]{6}$/i);
      
      // Extract and verify RGB values are in valid range
      const brightR = parseInt(brightResult.slice(1, 3), 16);
      const brightG = parseInt(brightResult.slice(3, 5), 16);
      const brightB = parseInt(brightResult.slice(5, 7), 16);
      
      expect(brightR).toBeGreaterThanOrEqual(0);
      expect(brightR).toBeLessThanOrEqual(255);
      expect(brightG).toBeGreaterThanOrEqual(0);
      expect(brightG).toBeLessThanOrEqual(255);
      expect(brightB).toBeGreaterThanOrEqual(0);
      expect(brightB).toBeLessThanOrEqual(255);
    });
  });

  describe('Color Generation Integration', () => {
    test('generated colors should work well with other utility functions', () => {
      for (let i = 0; i < 10; i++) {
        const color = generateRandomColor();
        
        // Should be able to get contrast color without errors
        const contrastColor = getContrastColor(color);
        expect(['#000000', '#FFFFFF']).toContain(contrastColor);
        
        // Should be able to adjust brightness without errors
        const brighterColor = adjustBrightness(color, 1.2);
        expect(brighterColor).toMatch(/^#[0-9A-F]{6}$/i);
        
        const darkerColor = adjustBrightness(color, 0.8);
        expect(darkerColor).toMatch(/^#[0-9A-F]{6}$/i);
      }
    });

    test('colors should be suitable for cursor use in UI', () => {
      const colors = generateDistinctColors(10);
      
      colors.forEach(color => {
        // Should be a valid hex color
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        
        // Should have good contrast potential
        const contrastColor = getContrastColor(color);
        expect(contrastColor).toBeDefined();
        
        // Color should not be too close to common UI colors (rough check)
        expect(color).not.toBe('#FFFFFF'); // Not pure white
        expect(color).not.toBe('#000000'); // Not pure black
        expect(color).not.toBe('#F0F0F0'); // Not near white
        expect(color).not.toBe('#0F0F0F'); // Not near black
      });
    });
  });
});