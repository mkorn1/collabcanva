/**
 * @jest-environment jsdom
 */

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INITIAL_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  PAN_SPEED
} from '../../utils/constants.js';

describe('Canvas Constants', () => {
  describe('Canvas Dimensions', () => {
    test('CANVAS_WIDTH should be a positive number', () => {
      expect(typeof CANVAS_WIDTH).toBe('number');
      expect(CANVAS_WIDTH).toBeGreaterThan(0);
      expect(CANVAS_WIDTH).toBe(4000);
    });

    test('CANVAS_HEIGHT should be a positive number', () => {
      expect(typeof CANVAS_HEIGHT).toBe('number');
      expect(CANVAS_HEIGHT).toBeGreaterThan(0);
      expect(CANVAS_HEIGHT).toBe(4000);
    });

    test('canvas should be square (width equals height)', () => {
      expect(CANVAS_WIDTH).toBe(CANVAS_HEIGHT);
    });
  });

  describe('Zoom Constants', () => {
    test('INITIAL_ZOOM should be 1 (100%)', () => {
      expect(INITIAL_ZOOM).toBe(1);
    });

    test('MIN_ZOOM should be reasonable (between 0.01 and 1)', () => {
      expect(MIN_ZOOM).toBeGreaterThan(0);
      expect(MIN_ZOOM).toBeLessThanOrEqual(1);
      expect(MIN_ZOOM).toBe(0.1);
    });

    test('MAX_ZOOM should be reasonable (between 1 and 20)', () => {
      expect(MAX_ZOOM).toBeGreaterThanOrEqual(1);
      expect(MAX_ZOOM).toBeLessThanOrEqual(20);
      expect(MAX_ZOOM).toBe(5.0);
    });

    test('zoom range should be valid (MIN < INITIAL < MAX)', () => {
      expect(MIN_ZOOM).toBeLessThan(INITIAL_ZOOM);
      expect(INITIAL_ZOOM).toBeLessThan(MAX_ZOOM);
    });

    test('ZOOM_STEP should be a reasonable increment', () => {
      expect(ZOOM_STEP).toBeGreaterThan(0);
      expect(ZOOM_STEP).toBeLessThanOrEqual(0.5);
      expect(ZOOM_STEP).toBe(0.1);
    });
  });

  describe('Interaction Constants', () => {
    test('PAN_SPEED should be a positive number', () => {
      expect(typeof PAN_SPEED).toBe('number');
      expect(PAN_SPEED).toBeGreaterThan(0);
      expect(PAN_SPEED).toBe(1);
    });
  });

  describe('All Constants Export', () => {
    test('all constants should be exported and defined', () => {
      expect(CANVAS_WIDTH).toBeDefined();
      expect(CANVAS_HEIGHT).toBeDefined();
      expect(INITIAL_ZOOM).toBeDefined();
      expect(MIN_ZOOM).toBeDefined();
      expect(MAX_ZOOM).toBeDefined();
      expect(ZOOM_STEP).toBeDefined();
      expect(PAN_SPEED).toBeDefined();
    });

    test('no constants should be null or undefined', () => {
      const constants = [
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        INITIAL_ZOOM,
        MIN_ZOOM,
        MAX_ZOOM,
        ZOOM_STEP,
        PAN_SPEED
      ];

      constants.forEach(constant => {
        expect(constant).not.toBeNull();
        expect(constant).not.toBeUndefined();
        expect(constant).not.toBeNaN();
      });
    });
  });
});
