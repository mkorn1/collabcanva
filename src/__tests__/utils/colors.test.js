// Unit tests for color generation utilities
import { describe, it, expect } from 'vitest'
import {
  generateRandomColor,
  generateRandomColorExcluding,
  generateDistinctColors,
  getContrastingCursorColor,
  isValidCursorColor,
  getAllCursorColors,
  hexToRgb,
  getColorBrightness,
  isLightColor
} from '../../utils/colors'

describe('Color Generation Utilities', () => {
  
  describe('generateRandomColor', () => {
    it('should return a valid hex color', () => {
      const color = generateRandomColor()
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should return colors from the predefined palette', () => {
      const allColors = getAllCursorColors()
      const color = generateRandomColor()
      expect(allColors).toContain(color)
    })

    it('should generate different colors when called multiple times', () => {
      const colors = new Set()
      
      // Generate 50 colors to increase chance of getting different ones
      for (let i = 0; i < 50; i++) {
        colors.add(generateRandomColor())
      }
      
      // Should get at least 2 different colors from 50 attempts
      expect(colors.size).toBeGreaterThanOrEqual(2)
    })

    it('should return hex colors in uppercase format', () => {
      const color = generateRandomColor()
      expect(color).toMatch(/^#[0-9A-F]{6}$/) // Uppercase hex
    })
  })

  describe('generateRandomColorExcluding', () => {
    it('should return a color different from the excluded color', () => {
      const excludeColor = '#FF6B6B'
      const color = generateRandomColorExcluding(excludeColor)
      
      expect(color).not.toBe(excludeColor)
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should return a valid color when excluding a color not in palette', () => {
      const excludeColor = '#FFFFFF' // White, not in our palette
      const color = generateRandomColorExcluding(excludeColor)
      
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      expect(isValidCursorColor(color)).toBe(true)
    })

    it('should handle excluding all colors gracefully', () => {
      // This is an edge case that shouldn't happen in practice
      const allColors = getAllCursorColors()
      
      // Try excluding a color that's in the palette
      if (allColors.length > 0) {
        const color = generateRandomColorExcluding(allColors[0])
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      }
    })
  })

  describe('generateDistinctColors', () => {
    it('should return empty array for count <= 0', () => {
      expect(generateDistinctColors(0)).toEqual([])
      expect(generateDistinctColors(-1)).toEqual([])
    })

    it('should return correct number of colors for valid count', () => {
      const colors = generateDistinctColors(5)
      expect(colors).toHaveLength(5)
    })

    it('should return all colors when count exceeds palette size', () => {
      const allColors = getAllCursorColors()
      const colors = generateDistinctColors(100) // More than available
      
      expect(colors).toHaveLength(allColors.length)
      expect(colors.sort()).toEqual(allColors.sort())
    })

    it('should return distinct colors (no duplicates)', () => {
      const colors = generateDistinctColors(10)
      const uniqueColors = [...new Set(colors)]
      
      expect(colors).toHaveLength(uniqueColors.length)
    })

    it('should return valid hex colors', () => {
      const colors = generateDistinctColors(3)
      
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })
  })

  describe('getContrastingCursorColor', () => {
    it('should return a valid hex color for any background', () => {
      const backgrounds = ['#FFFFFF', '#000000', '#FF0000', '#00FF00']
      
      backgrounds.forEach(bg => {
        const color = getContrastingCursorColor(bg)
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
        expect(isValidCursorColor(color)).toBe(true)
      })
    })

    it('should return a color from our palette', () => {
      const color = getContrastingCursorColor('#FFFFFF')
      expect(isValidCursorColor(color)).toBe(true)
    })
  })

  describe('isValidCursorColor', () => {
    it('should return true for colors in our palette', () => {
      const allColors = getAllCursorColors()
      
      allColors.forEach(color => {
        expect(isValidCursorColor(color)).toBe(true)
      })
    })

    it('should return false for colors not in our palette', () => {
      const invalidColors = ['#FFFFFF', '#000000', '#123456', '#ABCDEF']
      
      invalidColors.forEach(color => {
        expect(isValidCursorColor(color)).toBe(false)
      })
    })

    it('should handle invalid color formats', () => {
      const invalidFormats = ['red', 'rgb(255,0,0)', '#FF', '#GGGGGG', '']
      
      invalidFormats.forEach(color => {
        expect(isValidCursorColor(color)).toBe(false)
      })
    })
  })

  describe('getAllCursorColors', () => {
    it('should return an array of colors', () => {
      const colors = getAllCursorColors()
      expect(Array.isArray(colors)).toBe(true)
      expect(colors.length).toBeGreaterThan(0)
    })

    it('should return valid hex colors', () => {
      const colors = getAllCursorColors()
      
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })

    it('should return a copy of the colors array', () => {
      const colors1 = getAllCursorColors()
      const colors2 = getAllCursorColors()
      
      // Should be different array instances but same content
      expect(colors1).not.toBe(colors2) // Different references
      expect(colors1).toEqual(colors2) // Same content
    })

    it('should contain at least 10 distinct colors', () => {
      const colors = getAllCursorColors()
      const uniqueColors = new Set(colors)
      
      expect(uniqueColors.size).toBeGreaterThanOrEqual(10)
    })

    it('should not contain white or black colors', () => {
      const colors = getAllCursorColors()
      
      expect(colors).not.toContain('#FFFFFF')
      expect(colors).not.toContain('#000000')
    })
  })

  describe('hexToRgb', () => {
    it('should convert valid hex colors to RGB', () => {
      const testCases = [
        { hex: '#FF0000', expected: { r: 255, g: 0, b: 0 } },
        { hex: '#00FF00', expected: { r: 0, g: 255, b: 0 } },
        { hex: '#0000FF', expected: { r: 0, g: 0, b: 255 } },
        { hex: '#FFFFFF', expected: { r: 255, g: 255, b: 255 } },
        { hex: '#000000', expected: { r: 0, g: 0, b: 0 } },
      ]
      
      testCases.forEach(({ hex, expected }) => {
        expect(hexToRgb(hex)).toEqual(expected)
      })
    })

    it('should handle hex colors without # prefix', () => {
      expect(hexToRgb('FF0000')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('should return null for invalid hex colors', () => {
      const invalidColors = ['red', '#FF', '#GGGGGG', '', 'not-a-color']
      
      invalidColors.forEach(color => {
        expect(hexToRgb(color)).toBeNull()
      })
    })

    it('should handle lowercase hex colors', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#abcdef')).toEqual({ r: 171, g: 205, b: 239 })
    })
  })

  describe('getColorBrightness', () => {
    it('should return correct brightness values', () => {
      const testCases = [
        { hex: '#FFFFFF', expected: 255 }, // Pure white
        { hex: '#000000', expected: 0 },   // Pure black
        { hex: '#FF0000', expected: Math.round((255 * 299) / 1000) }, // Red
        { hex: '#00FF00', expected: Math.round((255 * 587) / 1000) }, // Green
        { hex: '#0000FF', expected: Math.round((255 * 114) / 1000) }, // Blue
      ]
      
      testCases.forEach(({ hex, expected }) => {
        expect(getColorBrightness(hex)).toBe(expected)
      })
    })

    it('should return 0 for invalid hex colors', () => {
      const invalidColors = ['red', '#FF', '', 'invalid']
      
      invalidColors.forEach(color => {
        expect(getColorBrightness(color)).toBe(0)
      })
    })

    it('should return values between 0 and 255', () => {
      const colors = getAllCursorColors()
      
      colors.forEach(color => {
        const brightness = getColorBrightness(color)
        expect(brightness).toBeGreaterThanOrEqual(0)
        expect(brightness).toBeLessThanOrEqual(255)
      })
    })
  })

  describe('isLightColor', () => {
    it('should correctly identify light colors', () => {
      const lightColors = ['#FFFFFF', '#FFFF00', '#00FFFF', '#FF99FF']
      
      lightColors.forEach(color => {
        expect(isLightColor(color)).toBe(true)
      })
    })

    it('should correctly identify dark colors', () => {
      const darkColors = ['#000000', '#800000', '#000080', '#008000']
      
      darkColors.forEach(color => {
        expect(isLightColor(color)).toBe(false)
      })
    })

    it('should handle edge case around brightness threshold', () => {
      // Test colors around the 127 brightness threshold
      expect(isLightColor('#808080')).toBe(true) // 128 brightness
      expect(isLightColor('#7F7F7F')).toBe(false) // 127 brightness
    })

    it('should handle invalid colors gracefully', () => {
      expect(isLightColor('invalid')).toBe(false)
      expect(isLightColor('')).toBe(false)
    })
  })

  describe('Color Palette Quality', () => {
    it('should have colors with good contrast potential', () => {
      const colors = getAllCursorColors()
      
      // Test that we have a mix of light and dark colors
      const lightColors = colors.filter(color => isLightColor(color))
      const darkColors = colors.filter(color => !isLightColor(color))
      
      expect(lightColors.length).toBeGreaterThan(0)
      expect(darkColors.length).toBeGreaterThan(0)
    })

    it('should not include very similar colors', () => {
      const colors = getAllCursorColors()
      
      // This is a basic check - in practice, you might want more sophisticated
      // color difference calculations using delta-E or similar algorithms
      expect(colors.length).toBe(new Set(colors).size) // No exact duplicates
    })

    it('should have reasonable color brightness distribution', () => {
      const colors = getAllCursorColors()
      const brightnesses = colors.map(color => getColorBrightness(color))
      
      const minBrightness = Math.min(...brightnesses)
      const maxBrightness = Math.max(...brightnesses)
      
      // Should have some variety in brightness
      expect(maxBrightness - minBrightness).toBeGreaterThan(50)
    })
  })

  describe('Integration Tests', () => {
    it('should work together for typical use cases', () => {
      // Simulate assigning colors to multiple users
      const userCount = 5
      const userColors = generateDistinctColors(userCount)
      
      expect(userColors).toHaveLength(userCount)
      
      // All should be valid
      userColors.forEach(color => {
        expect(isValidCursorColor(color)).toBe(true)
        expect(color).toMatch(/^#[0-9A-F]{6}$/i)
      })
      
      // Should be distinct
      expect(new Set(userColors).size).toBe(userCount)
    })

    it('should handle edge case of excluding colors', () => {
      const allColors = getAllCursorColors()
      
      if (allColors.length > 1) {
        const excludeColor = allColors[0]
        const newColor = generateRandomColorExcluding(excludeColor)
        
        expect(newColor).not.toBe(excludeColor)
        expect(isValidCursorColor(newColor)).toBe(true)
      }
    })
  })
})
