import { describe, it, expect } from 'vitest';
import {
  getFirstTouch,
  getLastTouch,
  getLinearAttribution,
  getUShapedAttribution,
  getTimeDecayAttribution,
  getAttribution
} from '@/attribution/models';
import type { TouchpointChain, Touchpoint, AttributionModel } from '@/types';

describe('attribution models', () => {
  const createTouchpoint = (
    typ: string,
    src: string,
    mdm: string,
    ts: number
  ): Touchpoint => ({
    typ,
    src,
    mdm,
    cmp: '',
    cnt: '',
    trm: '',
    ts
  });

  describe('getFirstTouch()', () => {
    it('should return empty result for empty chain', () => {
      const chain: TouchpointChain = { touchpoints: [] };
      const result = getFirstTouch(chain);
      
      expect(result.model).toBe('first');
      expect(result.credits).toEqual([]);
      expect(result.totalCredit).toBe(0);
    });

    it('should return 100% credit to first touchpoint', () => {
      const tp1 = createTouchpoint('utm', 'google', 'cpc', 1000);
      const tp2 = createTouchpoint('utm', 'facebook', 'cpc', 2000);
      const chain: TouchpointChain = { touchpoints: [tp1, tp2] };
      
      const result = getFirstTouch(chain);
      
      expect(result.model).toBe('first');
      expect(result.credits).toHaveLength(1);
      expect(result.credits[0].touchpoint).toEqual(tp1);
      expect(result.credits[0].credit).toBe(1.0);
      expect(result.totalCredit).toBe(1.0);
    });

    it('should handle single touchpoint', () => {
      const tp = createTouchpoint('utm', 'google', 'cpc', 1000);
      const chain: TouchpointChain = { touchpoints: [tp] };
      
      const result = getFirstTouch(chain);
      
      expect(result.credits[0].credit).toBe(1.0);
      expect(result.totalCredit).toBe(1.0);
    });
  });

  describe('getLastTouch()', () => {
    it('should return empty result for empty chain', () => {
      const chain: TouchpointChain = { touchpoints: [] };
      const result = getLastTouch(chain);
      
      expect(result.model).toBe('last');
      expect(result.credits).toEqual([]);
      expect(result.totalCredit).toBe(0);
    });

    it('should return 100% credit to last touchpoint', () => {
      const tp1 = createTouchpoint('utm', 'google', 'cpc', 1000);
      const tp2 = createTouchpoint('utm', 'facebook', 'cpc', 2000);
      const chain: TouchpointChain = { touchpoints: [tp1, tp2] };
      
      const result = getLastTouch(chain);
      
      expect(result.model).toBe('last');
      expect(result.credits).toHaveLength(1);
      expect(result.credits[0].touchpoint).toEqual(tp2);
      expect(result.credits[0].credit).toBe(1.0);
      expect(result.totalCredit).toBe(1.0);
    });

    it('should handle single touchpoint', () => {
      const tp = createTouchpoint('utm', 'google', 'cpc', 1000);
      const chain: TouchpointChain = { touchpoints: [tp] };
      
      const result = getLastTouch(chain);
      
      expect(result.credits[0].credit).toBe(1.0);
      expect(result.totalCredit).toBe(1.0);
    });
  });

  describe('getLinearAttribution()', () => {
    it('should return empty result for empty chain', () => {
      const chain: TouchpointChain = { touchpoints: [] };
      const result = getLinearAttribution(chain);
      
      expect(result.model).toBe('linear');
      expect(result.credits).toEqual([]);
      expect(result.totalCredit).toBe(0);
    });

    it('should distribute credit equally among all touchpoints', () => {
      const tp1 = createTouchpoint('utm', 'google', 'cpc', 1000);
      const tp2 = createTouchpoint('utm', 'facebook', 'cpc', 2000);
      const tp3 = createTouchpoint('organic', 'google', 'organic', 3000);
      const chain: TouchpointChain = { touchpoints: [tp1, tp2, tp3] };
      
      const result = getLinearAttribution(chain);
      
      expect(result.model).toBe('linear');
      expect(result.credits).toHaveLength(3);
      expect(result.credits[0].credit).toBeCloseTo(1/3, 10);
      expect(result.credits[1].credit).toBeCloseTo(1/3, 10);
      expect(result.credits[2].credit).toBeCloseTo(1/3, 10);
      expect(result.totalCredit).toBeCloseTo(1.0, 10);
    });

    it('should handle single touchpoint', () => {
      const tp = createTouchpoint('utm', 'google', 'cpc', 1000);
      const chain: TouchpointChain = { touchpoints: [tp] };
      
      const result = getLinearAttribution(chain);
      
      expect(result.credits[0].credit).toBe(1.0);
      expect(result.totalCredit).toBe(1.0);
    });

    it('should sum credits to exactly 1.0', () => {
      const touchpoints = Array.from({ length: 5 }, (_, i) =>
        createTouchpoint('utm', `source${i}`, 'cpc', 1000 + i * 1000)
      );
      const chain: TouchpointChain = { touchpoints };
      
      const result = getLinearAttribution(chain);
      const sum = result.credits.reduce((s, c) => s + c.credit, 0);
      
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  describe('getUShapedAttribution()', () => {
    it('should return empty result for empty chain', () => {
      const chain: TouchpointChain = { touchpoints: [] };
      const result = getUShapedAttribution(chain);
      
      expect(result.model).toBe('u-shaped');
      expect(result.credits).toEqual([]);
      expect(result.totalCredit).toBe(0);
    });

    it('should return 100% credit for single touchpoint', () => {
      const tp = createTouchpoint('utm', 'google', 'cpc', 1000);
      const chain: TouchpointChain = { touchpoints: [tp] };
      
      const result = getUShapedAttribution(chain);
      
      expect(result.credits[0].credit).toBe(1.0);
      expect(result.totalCredit).toBe(1.0);
    });

    it('should return 50% each for two touchpoints', () => {
      const tp1 = createTouchpoint('utm', 'google', 'cpc', 1000);
      const tp2 = createTouchpoint('utm', 'facebook', 'cpc', 2000);
      const chain: TouchpointChain = { touchpoints: [tp1, tp2] };
      
      const result = getUShapedAttribution(chain);
      
      expect(result.credits[0].credit).toBe(0.5);
      expect(result.credits[1].credit).toBe(0.5);
      expect(result.totalCredit).toBe(1.0);
    });

    it('should distribute 40% first, 40% last, 20% middle for 3+ touchpoints', () => {
      const tp1 = createTouchpoint('utm', 'google', 'cpc', 1000);
      const tp2 = createTouchpoint('utm', 'facebook', 'cpc', 2000);
      const tp3 = createTouchpoint('organic', 'google', 'organic', 3000);
      const chain: TouchpointChain = { touchpoints: [tp1, tp2, tp3] };
      
      const result = getUShapedAttribution(chain);
      
      expect(result.credits[0].credit).toBe(0.4); // First
      expect(result.credits[1].credit).toBe(0.2); // Middle (only one)
      expect(result.credits[2].credit).toBe(0.4); // Last
      expect(result.totalCredit).toBe(1.0);
    });

    it('should distribute 40% first, 40% last, 20% split among middle for 5 touchpoints', () => {
      const touchpoints = Array.from({ length: 5 }, (_, i) =>
        createTouchpoint('utm', `source${i}`, 'cpc', 1000 + i * 1000)
      );
      const chain: TouchpointChain = { touchpoints };
      
      const result = getUShapedAttribution(chain);
      
      expect(result.credits[0].credit).toBe(0.4); // First
      expect(result.credits[1].credit).toBeCloseTo(0.2 / 3, 10); // Middle 1
      expect(result.credits[2].credit).toBeCloseTo(0.2 / 3, 10); // Middle 2
      expect(result.credits[3].credit).toBeCloseTo(0.2 / 3, 10); // Middle 3
      expect(result.credits[4].credit).toBe(0.4); // Last
      
      const sum = result.credits.reduce((s, c) => s + c.credit, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should sum credits to exactly 1.0', () => {
      const touchpoints = Array.from({ length: 10 }, (_, i) =>
        createTouchpoint('utm', `source${i}`, 'cpc', 1000 + i * 1000)
      );
      const chain: TouchpointChain = { touchpoints };
      
      const result = getUShapedAttribution(chain);
      const sum = result.credits.reduce((s, c) => s + c.credit, 0);
      
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  describe('getTimeDecayAttribution()', () => {
    it('should return empty result for empty chain', () => {
      const chain: TouchpointChain = { touchpoints: [] };
      const result = getTimeDecayAttribution(chain);
      
      expect(result.model).toBe('time-decay');
      expect(result.credits).toEqual([]);
      expect(result.totalCredit).toBe(0);
    });

    it('should return 100% credit for single touchpoint', () => {
      const tp = createTouchpoint('utm', 'google', 'cpc', Date.now() - 1000);
      const chain: TouchpointChain = { touchpoints: [tp] };
      
      const result = getTimeDecayAttribution(chain);
      
      expect(result.credits[0].credit).toBe(1.0);
      expect(result.totalCredit).toBe(1.0);
    });

    it('should give more credit to newer touchpoints', () => {
      const now = Date.now();
      const tp1 = createTouchpoint('utm', 'google', 'cpc', now - 14 * 24 * 60 * 60 * 1000); // 14 days ago
      const tp2 = createTouchpoint('utm', 'facebook', 'cpc', now - 7 * 24 * 60 * 60 * 1000);  // 7 days ago
      const tp3 = createTouchpoint('organic', 'google', 'organic', now - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const chain: TouchpointChain = { touchpoints: [tp1, tp2, tp3] };
      
      const result = getTimeDecayAttribution(chain);
      
      // Newer touchpoints should have more credit
      expect(result.credits[2].credit).toBeGreaterThan(result.credits[1].credit);
      expect(result.credits[1].credit).toBeGreaterThan(result.credits[0].credit);
      
      // Sum should be 1.0
      const sum = result.credits.reduce((s, c) => s + c.credit, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should sum credits to exactly 1.0', () => {
      const now = Date.now();
      const touchpoints = Array.from({ length: 5 }, (_, i) =>
        createTouchpoint('utm', `source${i}`, 'cpc', now - (5 - i) * 24 * 60 * 60 * 1000)
      );
      const chain: TouchpointChain = { touchpoints };
      
      const result = getTimeDecayAttribution(chain);
      const sum = result.credits.reduce((s, c) => s + c.credit, 0);
      
      expect(sum).toBeCloseTo(1.0, 10);
    });

    it('should handle very recent touchpoints', () => {
      const now = Date.now();
      const tp1 = createTouchpoint('utm', 'google', 'cpc', now - 1000); // 1 second ago
      const tp2 = createTouchpoint('utm', 'facebook', 'cpc', now - 500);  // 0.5 seconds ago
      const chain: TouchpointChain = { touchpoints: [tp1, tp2] };
      
      const result = getTimeDecayAttribution(chain);
      
      // Both are very recent, but tp2 should have slightly more credit
      expect(result.credits[1].credit).toBeGreaterThan(result.credits[0].credit);
      expect(result.totalCredit).toBeCloseTo(1.0, 10);
    });
  });

  describe('getAttribution()', () => {
    const tp1 = createTouchpoint('utm', 'google', 'cpc', 1000);
    const tp2 = createTouchpoint('utm', 'facebook', 'cpc', 2000);
    const chain: TouchpointChain = { touchpoints: [tp1, tp2] };

    it('should return first touch for "first" model', () => {
      const result = getAttribution(chain, 'first');
      expect(result.model).toBe('first');
      expect(result.credits[0].touchpoint).toEqual(tp1);
    });

    it('should return last touch for "last" model', () => {
      const result = getAttribution(chain, 'last');
      expect(result.model).toBe('last');
      expect(result.credits[0].touchpoint).toEqual(tp2);
    });

    it('should return linear attribution for "linear" model', () => {
      const result = getAttribution(chain, 'linear');
      expect(result.model).toBe('linear');
      expect(result.credits).toHaveLength(2);
      expect(result.credits[0].credit).toBe(0.5);
      expect(result.credits[1].credit).toBe(0.5);
    });

    it('should return U-shaped attribution for "u-shaped" model', () => {
      const result = getAttribution(chain, 'u-shaped');
      expect(result.model).toBe('u-shaped');
      expect(result.credits[0].credit).toBe(0.5);
      expect(result.credits[1].credit).toBe(0.5);
    });

    it('should return time-decay attribution for "time-decay" model', () => {
      const result = getAttribution(chain, 'time-decay');
      expect(result.model).toBe('time-decay');
      expect(result.credits).toHaveLength(2);
      expect(result.totalCredit).toBeCloseTo(1.0, 10);
    });

    it('should fallback to last touch for unknown model', () => {
      const result = getAttribution(chain, 'unknown' as AttributionModel);
      expect(result.model).toBe('last');
      expect(result.credits[0].touchpoint).toEqual(tp2);
    });
  });
});

