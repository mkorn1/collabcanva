/**
 * Layout Templates Service
 * Provides pre-built layout templates for common UI patterns
 * Uses the enhanced arrange_shapes logic to create complex layouts
 */

import { executeCommand } from './commandExecutor';

/**
 * Layout Template Types
 */
export const LAYOUT_TEMPLATES = {
  LOGIN_FORM: 'login_form',
  CARD_LAYOUT: 'card_layout',
  NAVIGATION_BAR: 'navigation_bar',
  DASHBOARD: 'dashboard',
  FORM_LAYOUT: 'form_layout',
  HERO_SECTION: 'hero_section',
  FOOTER: 'footer',
  SIDEBAR: 'sidebar'
};

/**
 * Template Configuration Options
 */
export const TEMPLATE_OPTIONS = {
  // Size presets
  SIZE_PRESETS: {
    small: { width: 300, height: 200 },
    medium: { width: 500, height: 400 },
    large: { width: 800, height: 600 },
    xlarge: { width: 1200, height: 800 }
  },
  
  // Color schemes
  COLOR_SCHEMES: {
    modern: {
      primary: '#3498db',
      secondary: '#2c3e50',
      accent: '#e74c3c',
      background: '#ecf0f1',
      text: '#2c3e50'
    },
    dark: {
      primary: '#34495e',
      secondary: '#2c3e50',
      accent: '#e67e22',
      background: '#2c3e50',
      text: '#ecf0f1'
    },
    vibrant: {
      primary: '#e74c3c',
      secondary: '#f39c12',
      accent: '#9b59b6',
      background: '#f1c40f',
      text: '#2c3e50'
    },
    minimal: {
      primary: '#95a5a6',
      secondary: '#7f8c8d',
      accent: '#34495e',
      background: '#ffffff',
      text: '#2c3e50'
    }
  },
  
  // Spacing presets
  SPACING_PRESETS: {
    tight: 10,
    normal: 20,
    loose: 40,
    spacious: 60
  }
};

/**
 * Creates a login form layout
 * @param {Object} canvasContext - Canvas context
 * @param {Object} options - Template options
 * @param {Object} user - Current user
 * @returns {Promise<Object>} - Execution result
 */
export async function createLoginFormLayout(canvasContext, options = {}, user) {
  const {
    size = 'medium',
    colorScheme = 'modern',
    spacing = 'normal',
    startX = 100,
    startY = 100
  } = options;
  
  const templateSize = TEMPLATE_OPTIONS.SIZE_PRESETS[size];
  const colors = TEMPLATE_OPTIONS.COLOR_SCHEMES[colorScheme];
  const spacingValue = TEMPLATE_OPTIONS.SPACING_PRESETS[spacing];
  
  // Create login form elements
  const elements = [
    // Header/Title
    {
      type: 'text',
      text_content: 'Welcome Back',
      fontSize: 24,
      fontFamily: 'Arial',
      width: templateSize.width - 40,
      height: 40,
      fill: colors.text,
      x: startX + 20,
      y: startY + 20
    },
    
    // Username field background
    {
      type: 'rectangle',
      width: templateSize.width - 40,
      height: 50,
      fill: colors.background,
      stroke: colors.secondary,
      strokeWidth: 2,
      x: startX + 20,
      y: startY + 80
    },
    
    // Username label
    {
      type: 'text',
      text_content: 'Username',
      fontSize: 14,
      fontFamily: 'Arial',
      width: 100,
      height: 20,
      fill: colors.text,
      x: startX + 30,
      y: startY + 60
    },
    
    // Password field background
    {
      type: 'rectangle',
      width: templateSize.width - 40,
      height: 50,
      fill: colors.background,
      stroke: colors.secondary,
      strokeWidth: 2,
      x: startX + 20,
      y: startY + 150
    },
    
    // Password label
    {
      type: 'text',
      text_content: 'Password',
      fontSize: 14,
      fontFamily: 'Arial',
      width: 100,
      height: 20,
      fill: colors.text,
      x: startX + 30,
      y: startY + 130
    },
    
    // Login button
    {
      type: 'rectangle',
      width: templateSize.width - 40,
      height: 50,
      fill: colors.primary,
      stroke: colors.primary,
      strokeWidth: 1,
      x: startX + 20,
      y: startY + 220
    },
    
    // Login button text
    {
      type: 'text',
      text_content: 'Login',
      fontSize: 16,
      fontFamily: 'Arial',
      width: 100,
      height: 30,
      fill: colors.background,
      x: startX + templateSize.width / 2 - 25,
      y: startY + 235
    },
    
    // Form container background
    {
      type: 'rectangle',
      width: templateSize.width,
      height: templateSize.height,
      fill: colors.background,
      stroke: colors.secondary,
      strokeWidth: 1,
      x: startX,
      y: startY
    }
  ];
  
  // Create all elements
  const results = [];
  for (const element of elements) {
    try {
      const result = await executeCommand({
        name: 'create_shape',
        arguments: element
      }, canvasContext, user);
      
      results.push(result);
    } catch (error) {
      console.error('Error creating login form element:', error);
    }
  }
  
  return {
    success: true,
    message: `Created login form layout with ${elements.length} elements`,
    templateType: LAYOUT_TEMPLATES.LOGIN_FORM,
    elementsCreated: elements.length,
    results: results
  };
}

/**
 * Creates a card layout
 * @param {Object} canvasContext - Canvas context
 * @param {Object} options - Template options
 * @param {Object} user - Current user
 * @returns {Promise<Object>} - Execution result
 */
export async function createCardLayout(canvasContext, options = {}, user) {
  const {
    size = 'medium',
    colorScheme = 'modern',
    spacing = 'normal',
    startX = 100,
    startY = 100,
    cardCount = 3
  } = options;
  
  const templateSize = TEMPLATE_OPTIONS.SIZE_PRESETS[size];
  const colors = TEMPLATE_OPTIONS.COLOR_SCHEMES[colorScheme];
  const spacingValue = TEMPLATE_OPTIONS.SPACING_PRESETS[spacing];
  
  const cardWidth = (templateSize.width - (cardCount + 1) * spacingValue) / cardCount;
  const cardHeight = templateSize.height - 100; // Leave space for header
  
  // Create header
  const headerResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'text',
      text_content: 'Card Layout',
      fontSize: 28,
      fontFamily: 'Arial',
      width: templateSize.width,
      height: 50,
      fill: colors.text,
      x: startX,
      y: startY
    }
  }, canvasContext, user);
  
  // Create cards
  const cardResults = [];
  for (let i = 0; i < cardCount; i++) {
    const cardX = startX + (i + 1) * spacingValue + i * cardWidth;
    const cardY = startY + 60;
    
    // Card background
    const cardBgResult = await executeCommand({
      name: 'create_shape',
      arguments: {
        type: 'rectangle',
        width: cardWidth,
        height: cardHeight,
        fill: colors.background,
        stroke: colors.secondary,
        strokeWidth: 2,
        x: cardX,
        y: cardY
      }
    }, canvasContext, user);
    
    // Card title
    const cardTitleResult = await executeCommand({
      name: 'create_shape',
      arguments: {
        type: 'text',
        text_content: `Card ${i + 1}`,
        fontSize: 18,
        fontFamily: 'Arial',
        width: cardWidth - 20,
        height: 30,
        fill: colors.text,
        x: cardX + 10,
        y: cardY + 10
      }
    }, canvasContext, user);
    
    // Card content
    const cardContentResult = await executeCommand({
      name: 'create_shape',
      arguments: {
        type: 'text',
        text_content: 'This is card content that can be customized.',
        fontSize: 14,
        fontFamily: 'Arial',
        width: cardWidth - 20,
        height: cardHeight - 60,
        fill: colors.text,
        x: cardX + 10,
        y: cardY + 50
      }
    }, canvasContext, user);
    
    cardResults.push({ cardBgResult, cardTitleResult, cardContentResult });
  }
  
  return {
    success: true,
    message: `Created card layout with ${cardCount} cards`,
    templateType: LAYOUT_TEMPLATES.CARD_LAYOUT,
    cardsCreated: cardCount,
    results: { headerResult, cardResults }
  };
}

/**
 * Creates a navigation bar layout
 * @param {Object} canvasContext - Canvas context
 * @param {Object} options - Template options
 * @param {Object} user - Current user
 * @returns {Promise<Object>} - Execution result
 */
export async function createNavigationBarLayout(canvasContext, options = {}, user) {
  const {
    size = 'large',
    colorScheme = 'modern',
    spacing = 'normal',
    startX = 100,
    startY = 100,
    navItems = ['Home', 'About', 'Services', 'Contact']
  } = options;
  
  const templateSize = TEMPLATE_OPTIONS.SIZE_PRESETS[size];
  const colors = TEMPLATE_OPTIONS.COLOR_SCHEMES[colorScheme];
  const spacingValue = TEMPLATE_OPTIONS.SPACING_PRESETS[spacing];
  
  const navHeight = 60;
  const itemWidth = (templateSize.width - (navItems.length + 1) * spacingValue) / navItems.length;
  
  // Create navigation bar background
  const navBgResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      width: templateSize.width,
      height: navHeight,
      fill: colors.primary,
      stroke: colors.primary,
      strokeWidth: 1,
      x: startX,
      y: startY
    }
  }, canvasContext, user);
  
  // Create logo/brand
  const logoResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'text',
      text_content: 'Brand',
      fontSize: 20,
      fontFamily: 'Arial',
      width: 100,
      height: 30,
      fill: colors.background,
      x: startX + 20,
      y: startY + 15
    }
  }, canvasContext, user);
  
  // Create navigation items
  const navItemResults = [];
  for (let i = 0; i < navItems.length; i++) {
    const itemX = startX + templateSize.width - (navItems.length - i) * (itemWidth + spacingValue);
    const itemY = startY + 15;
    
    const navItemResult = await executeCommand({
      name: 'create_shape',
      arguments: {
        type: 'text',
        text_content: navItems[i],
        fontSize: 16,
        fontFamily: 'Arial',
        width: itemWidth,
        height: 30,
        fill: colors.background,
        x: itemX,
        y: itemY
      }
    }, canvasContext, user);
    
    navItemResults.push(navItemResult);
  }
  
  return {
    success: true,
    message: `Created navigation bar with ${navItems.length} items`,
    templateType: LAYOUT_TEMPLATES.NAVIGATION_BAR,
    navItemsCreated: navItems.length,
    results: { navBgResult, logoResult, navItemResults }
  };
}

/**
 * Creates a dashboard layout
 * @param {Object} canvasContext - Canvas context
 * @param {Object} options - Template options
 * @param {Object} user - Current user
 * @returns {Promise<Object>} - Execution result
 */
export async function createDashboardLayout(canvasContext, options = {}, user) {
  const {
    size = 'xlarge',
    colorScheme = 'modern',
    spacing = 'normal',
    startX = 100,
    startY = 100
  } = options;
  
  const templateSize = TEMPLATE_OPTIONS.SIZE_PRESETS[size];
  const colors = TEMPLATE_OPTIONS.COLOR_SCHEMES[colorScheme];
  const spacingValue = TEMPLATE_OPTIONS.SPACING_PRESETS[spacing];
  
  // Create dashboard header
  const headerResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'text',
      text_content: 'Dashboard',
      fontSize: 32,
      fontFamily: 'Arial',
      width: templateSize.width,
      height: 60,
      fill: colors.text,
      x: startX,
      y: startY
    }
  }, canvasContext, user);
  
  // Create sidebar
  const sidebarResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      width: 200,
      height: templateSize.height - 60,
      fill: colors.secondary,
      stroke: colors.secondary,
      strokeWidth: 1,
      x: startX,
      y: startY + 60
    }
  }, canvasContext, user);
  
  // Create main content area
  const mainContentResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      width: templateSize.width - 200 - spacingValue,
      height: templateSize.height - 60,
      fill: colors.background,
      stroke: colors.secondary,
      strokeWidth: 1,
      x: startX + 200 + spacingValue,
      y: startY + 60
    }
  }, canvasContext, user);
  
  // Create sidebar menu items
  const menuItems = ['Overview', 'Analytics', 'Reports', 'Settings'];
  const menuItemResults = [];
  
  for (let i = 0; i < menuItems.length; i++) {
    const menuItemResult = await executeCommand({
      name: 'create_shape',
      arguments: {
        type: 'text',
        text_content: menuItems[i],
        fontSize: 16,
        fontFamily: 'Arial',
        width: 180,
        height: 30,
        fill: colors.background,
        x: startX + 10,
        y: startY + 80 + i * 40
      }
    }, canvasContext, user);
    
    menuItemResults.push(menuItemResult);
  }
  
  return {
    success: true,
    message: 'Created dashboard layout with sidebar and main content',
    templateType: LAYOUT_TEMPLATES.DASHBOARD,
    elementsCreated: 4 + menuItems.length,
    results: { headerResult, sidebarResult, mainContentResult, menuItemResults }
  };
}

/**
 * Creates a hero section layout
 * @param {Object} canvasContext - Canvas context
 * @param {Object} options - Template options
 * @param {Object} user - Current user
 * @returns {Promise<Object>} - Execution result
 */
export async function createHeroSectionLayout(canvasContext, options = {}, user) {
  const {
    size = 'large',
    colorScheme = 'modern',
    spacing = 'normal',
    startX = 100,
    startY = 100
  } = options;
  
  const templateSize = TEMPLATE_OPTIONS.SIZE_PRESETS[size];
  const colors = TEMPLATE_OPTIONS.COLOR_SCHEMES[colorScheme];
  const spacingValue = TEMPLATE_OPTIONS.SPACING_PRESETS[spacing];
  
  // Create hero background
  const heroBgResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      width: templateSize.width,
      height: templateSize.height,
      fill: colors.primary,
      stroke: colors.primary,
      strokeWidth: 1,
      x: startX,
      y: startY
    }
  }, canvasContext, user);
  
  // Create hero title
  const heroTitleResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'text',
      text_content: 'Welcome to Our Platform',
      fontSize: 36,
      fontFamily: 'Arial',
      width: templateSize.width - 40,
      height: 50,
      fill: colors.background,
      x: startX + 20,
      y: startY + templateSize.height / 2 - 100
    }
  }, canvasContext, user);
  
  // Create hero subtitle
  const heroSubtitleResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'text',
      text_content: 'Discover amazing features and create something incredible',
      fontSize: 18,
      fontFamily: 'Arial',
      width: templateSize.width - 40,
      height: 30,
      fill: colors.background,
      x: startX + 20,
      y: startY + templateSize.height / 2 - 40
    }
  }, canvasContext, user);
  
  // Create call-to-action button
  const ctaButtonResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'rectangle',
      width: 200,
      height: 50,
      fill: colors.accent,
      stroke: colors.accent,
      strokeWidth: 1,
      x: startX + templateSize.width / 2 - 100,
      y: startY + templateSize.height / 2 + 20
    }
  }, canvasContext, user);
  
  // Create CTA button text
  const ctaTextResult = await executeCommand({
    name: 'create_shape',
    arguments: {
      type: 'text',
      text_content: 'Get Started',
      fontSize: 16,
      fontFamily: 'Arial',
      width: 100,
      height: 30,
      fill: colors.background,
      x: startX + templateSize.width / 2 - 50,
      y: startY + templateSize.height / 2 + 35
    }
  }, canvasContext, user);
  
  return {
    success: true,
    message: 'Created hero section layout with title, subtitle, and CTA button',
    templateType: LAYOUT_TEMPLATES.HERO_SECTION,
    elementsCreated: 5,
    results: { heroBgResult, heroTitleResult, heroSubtitleResult, ctaButtonResult, ctaTextResult }
  };
}

/**
 * Main function to create layout templates
 * @param {string} templateType - Type of template to create
 * @param {Object} canvasContext - Canvas context
 * @param {Object} options - Template options
 * @param {Object} user - Current user
 * @returns {Promise<Object>} - Execution result
 */
export async function createLayoutTemplate(templateType, canvasContext, options = {}, user) {
  switch (templateType) {
    case LAYOUT_TEMPLATES.LOGIN_FORM:
      return await createLoginFormLayout(canvasContext, options, user);
    
    case LAYOUT_TEMPLATES.CARD_LAYOUT:
      return await createCardLayout(canvasContext, options, user);
    
    case LAYOUT_TEMPLATES.NAVIGATION_BAR:
      return await createNavigationBarLayout(canvasContext, options, user);
    
    case LAYOUT_TEMPLATES.DASHBOARD:
      return await createDashboardLayout(canvasContext, options, user);
    
    case LAYOUT_TEMPLATES.HERO_SECTION:
      return await createHeroSectionLayout(canvasContext, options, user);
    
    default:
      return {
        success: false,
        message: `Unknown template type: ${templateType}`,
        type: 'error'
      };
  }
}

/**
 * Gets available template types
 * @returns {Array} - Array of available template types
 */
export function getAvailableTemplates() {
  return Object.values(LAYOUT_TEMPLATES);
}

/**
 * Gets template options for a specific template type
 * @param {string} templateType - Template type
 * @returns {Object} - Template options
 */
export function getTemplateOptions(templateType) {
  const baseOptions = {
    size: Object.keys(TEMPLATE_OPTIONS.SIZE_PRESETS),
    colorScheme: Object.keys(TEMPLATE_OPTIONS.COLOR_SCHEMES),
    spacing: Object.keys(TEMPLATE_OPTIONS.SPACING_PRESETS)
  };
  
  switch (templateType) {
    case LAYOUT_TEMPLATES.CARD_LAYOUT:
      return {
        ...baseOptions,
        cardCount: [2, 3, 4, 5, 6]
      };
    
    case LAYOUT_TEMPLATES.NAVIGATION_BAR:
      return {
        ...baseOptions,
        navItems: ['Home', 'About', 'Services', 'Contact', 'Blog', 'Portfolio']
      };
    
    default:
      return baseOptions;
  }
}

export default {
  createLayoutTemplate,
  getAvailableTemplates,
  getTemplateOptions,
  LAYOUT_TEMPLATES,
  TEMPLATE_OPTIONS
};
