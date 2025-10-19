import { describe, test, expect, beforeEach } from 'vitest';
import { executeCommand } from '../../services/commandExecutor';
import { createLayoutTemplate, LAYOUT_TEMPLATES, TEMPLATE_OPTIONS } from '../../services/layoutTemplates';

describe('Layout Templates Service', () => {
  let mockCanvasContext;
  let mockUser;

  beforeEach(() => {
    mockUser = { uid: 'test-user', displayName: 'Test User' };
    mockCanvasContext = {
      updateObject: async (id, updates) => {
        return { success: true };
      },
      addObject: async (object) => {
        return { success: true, id: 'generated-id' };
      },
      objects: []
    };
  });

  describe('Template Constants', () => {
    test('should have all required template types', () => {
      expect(LAYOUT_TEMPLATES.LOGIN_FORM).toBe('login_form');
      expect(LAYOUT_TEMPLATES.CARD_LAYOUT).toBe('card_layout');
      expect(LAYOUT_TEMPLATES.NAVIGATION_BAR).toBe('navigation_bar');
      expect(LAYOUT_TEMPLATES.DASHBOARD).toBe('dashboard');
      expect(LAYOUT_TEMPLATES.HERO_SECTION).toBe('hero_section');
    });

    test('should have size presets', () => {
      expect(TEMPLATE_OPTIONS.SIZE_PRESETS.small).toEqual({ width: 300, height: 200 });
      expect(TEMPLATE_OPTIONS.SIZE_PRESETS.medium).toEqual({ width: 500, height: 400 });
      expect(TEMPLATE_OPTIONS.SIZE_PRESETS.large).toEqual({ width: 800, height: 600 });
      expect(TEMPLATE_OPTIONS.SIZE_PRESETS.xlarge).toEqual({ width: 1200, height: 800 });
    });

    test('should have color schemes', () => {
      expect(TEMPLATE_OPTIONS.COLOR_SCHEMES.modern).toHaveProperty('primary');
      expect(TEMPLATE_OPTIONS.COLOR_SCHEMES.dark).toHaveProperty('primary');
      expect(TEMPLATE_OPTIONS.COLOR_SCHEMES.vibrant).toHaveProperty('primary');
      expect(TEMPLATE_OPTIONS.COLOR_SCHEMES.minimal).toHaveProperty('primary');
    });

    test('should have spacing presets', () => {
      expect(TEMPLATE_OPTIONS.SPACING_PRESETS.tight).toBe(10);
      expect(TEMPLATE_OPTIONS.SPACING_PRESETS.normal).toBe(20);
      expect(TEMPLATE_OPTIONS.SPACING_PRESETS.loose).toBe(40);
      expect(TEMPLATE_OPTIONS.SPACING_PRESETS.spacious).toBe(60);
    });
  });

  describe('Login Form Template', () => {
    test('should create login form layout', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.LOGIN_FORM,
        mockCanvasContext,
        { startX: 100, startY: 100, size: 'medium' },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.templateType).toBe(LAYOUT_TEMPLATES.LOGIN_FORM);
      expect(result.elementsCreated).toBeGreaterThan(0);
    });

    test('should create login form with custom options', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.LOGIN_FORM,
        mockCanvasContext,
        { 
          startX: 200, 
          startY: 200, 
          size: 'large', 
          colorScheme: 'dark',
          spacing: 'loose'
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.templateType).toBe(LAYOUT_TEMPLATES.LOGIN_FORM);
    });
  });

  describe('Card Layout Template', () => {
    test('should create card layout with default options', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.CARD_LAYOUT,
        mockCanvasContext,
        { startX: 100, startY: 100 },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.templateType).toBe(LAYOUT_TEMPLATES.CARD_LAYOUT);
      expect(result.cardsCreated).toBe(3); // Default card count
    });

    test('should create card layout with custom card count', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.CARD_LAYOUT,
        mockCanvasContext,
        { 
          startX: 100, 
          startY: 100, 
          cardCount: 5,
          size: 'large'
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(5);
    });
  });

  describe('Navigation Bar Template', () => {
    test('should create navigation bar layout', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.NAVIGATION_BAR,
        mockCanvasContext,
        { startX: 100, startY: 100 },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.templateType).toBe(LAYOUT_TEMPLATES.NAVIGATION_BAR);
      expect(result.navItemsCreated).toBeGreaterThan(0);
    });

    test('should create navigation bar with custom nav items', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.NAVIGATION_BAR,
        mockCanvasContext,
        { 
          startX: 100, 
          startY: 100,
          navItems: ['Home', 'About', 'Contact']
        },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.navItemsCreated).toBe(3);
    });
  });

  describe('Dashboard Template', () => {
    test('should create dashboard layout', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.DASHBOARD,
        mockCanvasContext,
        { startX: 100, startY: 100 },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.templateType).toBe(LAYOUT_TEMPLATES.DASHBOARD);
      expect(result.elementsCreated).toBeGreaterThan(0);
    });

    test('should create dashboard with custom size', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.DASHBOARD,
        mockCanvasContext,
        { 
          startX: 100, 
          startY: 100,
          size: 'xlarge',
          colorScheme: 'dark'
        },
        mockUser
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Hero Section Template', () => {
    test('should create hero section layout', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.HERO_SECTION,
        mockCanvasContext,
        { startX: 100, startY: 100 },
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.templateType).toBe(LAYOUT_TEMPLATES.HERO_SECTION);
      expect(result.elementsCreated).toBe(5); // Background, title, subtitle, button, button text
    });

    test('should create hero section with vibrant colors', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.HERO_SECTION,
        mockCanvasContext,
        { 
          startX: 100, 
          startY: 100,
          colorScheme: 'vibrant',
          size: 'large'
        },
        mockUser
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid template type', async () => {
      const result = await createLayoutTemplate(
        'invalid_template',
        mockCanvasContext,
        { startX: 100, startY: 100 },
        mockUser
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown template type');
    });

    test('should handle missing options gracefully', async () => {
      const result = await createLayoutTemplate(
        LAYOUT_TEMPLATES.LOGIN_FORM,
        mockCanvasContext,
        {}, // Empty options
        mockUser
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Command Executor Integration', () => {
    test('should execute create_layout_template command', async () => {
      const result = await executeCommand({
        name: 'create_layout_template',
        arguments: {
          template_type: 'login_form',
          start_x: 100,
          start_y: 100,
          size: 'medium',
          color_scheme: 'modern'
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.type).toBe('template_created');
      expect(result.templateType).toBe('login_form');
    });

    test('should handle missing required arguments', async () => {
      const result = await executeCommand({
        name: 'create_layout_template',
        arguments: {
          template_type: 'login_form'
          // Missing start_x and start_y
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Missing start_x or start_y');
    });

    test('should handle invalid template type in command', async () => {
      const result = await executeCommand({
        name: 'create_layout_template',
        arguments: {
          template_type: 'invalid_type',
          start_x: 100,
          start_y: 100
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid template_type');
    });

    test('should handle out of bounds coordinates', async () => {
      const result = await executeCommand({
        name: 'create_layout_template',
        arguments: {
          template_type: 'login_form',
          start_x: 3000, // Out of bounds
          start_y: 100
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Start coordinates must be within canvas bounds');
    });

    test('should execute card layout with custom options', async () => {
      const result = await executeCommand({
        name: 'create_layout_template',
        arguments: {
          template_type: 'card_layout',
          start_x: 100,
          start_y: 100,
          size: 'large',
          color_scheme: 'vibrant',
          spacing: 'loose',
          options: {
            cardCount: 4
          }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.templateType).toBe('card_layout');
    });

    test('should execute navigation bar with custom nav items', async () => {
      const result = await executeCommand({
        name: 'create_layout_template',
        arguments: {
          template_type: 'navigation_bar',
          start_x: 100,
          start_y: 100,
          size: 'large',
          color_scheme: 'dark',
          options: {
            navItems: ['Home', 'Products', 'About', 'Contact', 'Blog']
          }
        }
      }, mockCanvasContext, mockUser);

      expect(result.success).toBe(true);
      expect(result.templateType).toBe('navigation_bar');
    });
  });

  describe('Template Options', () => {
    test('should support all size presets', async () => {
      const sizes = ['small', 'medium', 'large', 'xlarge'];
      
      for (const size of sizes) {
        const result = await createLayoutTemplate(
          LAYOUT_TEMPLATES.LOGIN_FORM,
          mockCanvasContext,
          { startX: 100, startY: 100, size },
          mockUser
        );
        
        expect(result.success).toBe(true);
      }
    });

    test('should support all color schemes', async () => {
      const colorSchemes = ['modern', 'dark', 'vibrant', 'minimal'];
      
      for (const colorScheme of colorSchemes) {
        const result = await createLayoutTemplate(
          LAYOUT_TEMPLATES.CARD_LAYOUT,
          mockCanvasContext,
          { startX: 100, startY: 100, colorScheme },
          mockUser
        );
        
        expect(result.success).toBe(true);
      }
    });

    test('should support all spacing presets', async () => {
      const spacingOptions = ['tight', 'normal', 'loose', 'spacious'];
      
      for (const spacing of spacingOptions) {
        const result = await createLayoutTemplate(
          LAYOUT_TEMPLATES.NAVIGATION_BAR,
          mockCanvasContext,
          { startX: 100, startY: 100, spacing },
          mockUser
        );
        
        expect(result.success).toBe(true);
      }
    });
  });
});
