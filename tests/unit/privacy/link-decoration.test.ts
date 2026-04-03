import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  isAllowedDomain,
  getDecorationParams,
  decorateLink,
  initLinkDecoration
} from '@/privacy/link-decoration';
import type { ResolvedLinkDecorationConfig, IntkData, TrafficSource, ClickIds } from '@/types';
import { mockLocation } from '../../setup';

describe('privacy/link-decoration', () => {
  beforeEach(() => {
    mockLocation('http://localhost/');
  });

  describe('isAllowedDomain()', () => {
    it('should return false when allowedDomains is empty', () => {
      expect(isAllowedDomain('http://partner.com/', [])).toBe(false);
    });

    it('should return false when allowedDomains is undefined', () => {
      expect(isAllowedDomain('http://partner.com/', undefined as any)).toBe(false);
    });

    it('should return true for exact domain match', () => {
      expect(isAllowedDomain('http://partner.com/page', ['partner.com'])).toBe(true);
    });

    it('should return true for domain match with www prefix', () => {
      expect(isAllowedDomain('http://www.partner.com/page', ['partner.com'])).toBe(true);
    });

    it('should return true for allowed domain with www in pattern', () => {
      expect(isAllowedDomain('http://partner.com/page', ['www.partner.com'])).toBe(true);
    });

    it('should return false for non-matching domain', () => {
      expect(isAllowedDomain('http://other.com/page', ['partner.com'])).toBe(false);
    });

    it('should return false for same-origin links', () => {
      mockLocation('http://partner.com/');
      expect(isAllowedDomain('http://partner.com/other-page', ['partner.com'])).toBe(false);
    });

    it('should support wildcard subdomain pattern', () => {
      expect(isAllowedDomain('http://sub.partner.com/page', ['*.partner.com'])).toBe(true);
      expect(isAllowedDomain('http://deep.sub.partner.com/page', ['*.partner.com'])).toBe(true);
    });

    it('should match base domain with wildcard pattern', () => {
      expect(isAllowedDomain('http://partner.com/page', ['*.partner.com'])).toBe(true);
    });

    it('should not match unrelated domain with wildcard pattern', () => {
      expect(isAllowedDomain('http://other.com/page', ['*.partner.com'])).toBe(false);
      expect(isAllowedDomain('http://partnerx.com/page', ['*.partner.com'])).toBe(false);
    });

    it('should check multiple allowed domains', () => {
      const allowedDomains = ['partner.com', 'affiliate.org', '*.example.com'];
      
      expect(isAllowedDomain('http://partner.com/', allowedDomains)).toBe(true);
      expect(isAllowedDomain('http://affiliate.org/', allowedDomains)).toBe(true);
      expect(isAllowedDomain('http://sub.example.com/', allowedDomains)).toBe(true);
      expect(isAllowedDomain('http://unrelated.com/', allowedDomains)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isAllowedDomain('http://PARTNER.COM/page', ['partner.com'])).toBe(true);
      expect(isAllowedDomain('http://partner.com/page', ['PARTNER.COM'])).toBe(true);
    });

    it('should handle URLs with paths and query strings', () => {
      expect(isAllowedDomain('http://partner.com/path/to/page?query=1', ['partner.com'])).toBe(true);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(isAllowedDomain('not-a-url', ['partner.com'])).toBe(false);
      expect(isAllowedDomain('', ['partner.com'])).toBe(false);
    });
  });

  describe('getDecorationParams()', () => {
    const createConfig = (overrides: Partial<ResolvedLinkDecorationConfig> = {}): ResolvedLinkDecorationConfig => ({
      enabled: true,
      allowedDomains: ['partner.com'],
      decorateUtm: true,
      decorateClickIds: true,
      customParams: {},
      ...overrides
    });

    const createTrafficSource = (overrides: Partial<TrafficSource> = {}): TrafficSource => ({
      typ: 'utm',
      src: 'google',
      mdm: 'cpc',
      cmp: 'summer_sale',
      cnt: 'banner',
      trm: 'shoes',
      ...overrides
    });

    const createClickIds = (overrides: Partial<ClickIds> = {}): ClickIds => ({
      gclid: 'abc123',
      fbclid: 'def456',
      ...overrides
    });

    const createIntkData = (overrides: Partial<IntkData> = {}): IntkData => ({
      current: createTrafficSource(),
      current_add: { fd: '2024-01-01', ep: '/', rf: '(none)' },
      first: createTrafficSource(),
      first_add: { fd: '2024-01-01', ep: '/', rf: '(none)' },
      session: { pgs: 1, cpg: '/' },
      udata: { vst: 1, uip: '(none)', uag: 'test' },
      promo: {},
      click_ids: createClickIds(),
      ...overrides
    });

    it('should extract UTM parameters from current source', () => {
      const config = createConfig();
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(params).toEqual(expect.objectContaining({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'summer_sale',
        utm_content: 'banner',
        utm_term: 'shoes'
      }));
    });

    it('should extract click IDs', () => {
      const config = createConfig();
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(params).toEqual(expect.objectContaining({
        gclid: 'abc123',
        fbclid: 'def456'
      }));
    });

    it('should skip UTM extraction when decorateUtm is false', () => {
      const config = createConfig({ decorateUtm: false });
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(params).not.toHaveProperty('utm_source');
      expect(params).not.toHaveProperty('utm_medium');
      expect(params).toHaveProperty('gclid');
    });

    it('should skip click IDs extraction when decorateClickIds is false', () => {
      const config = createConfig({ decorateClickIds: false });
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(params).toHaveProperty('utm_source');
      expect(params).not.toHaveProperty('gclid');
      expect(params).not.toHaveProperty('fbclid');
    });

    it('should add custom parameters', () => {
      const config = createConfig({
        customParams: {
          affiliate_id: 'xyz789',
          partner: 'acme'
        }
      });
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(params).toEqual(expect.objectContaining({
        affiliate_id: 'xyz789',
        partner: 'acme'
      }));
    });

    it('should let custom parameters override auto-detected ones', () => {
      const config = createConfig({
        customParams: {
          utm_source: 'custom_source'
        }
      });
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(params.utm_source).toBe('custom_source');
    });

    it('should skip empty UTM values', () => {
      const config = createConfig();
      const data = createIntkData({
        current: createTrafficSource({ cnt: '', trm: '' })
      });
      
      const params = getDecorationParams(config, data);
      
      expect(params).not.toHaveProperty('utm_content');
      expect(params).not.toHaveProperty('utm_term');
    });

    it('should skip default values like (none)', () => {
      const config = createConfig();
      const data = createIntkData({
        current: createTrafficSource({ cmp: '(none)', cnt: '(not set)' })
      });
      
      const params = getDecorationParams(config, data);
      
      expect(params).not.toHaveProperty('utm_campaign');
      expect(params).not.toHaveProperty('utm_content');
    });

    it('should handle missing click_ids', () => {
      const config = createConfig();
      const data = createIntkData({ click_ids: undefined });
      
      const params = getDecorationParams(config, data);
      
      expect(params).toHaveProperty('utm_source');
      expect(params).not.toHaveProperty('gclid');
    });

    it('should return empty object when both decorateUtm and decorateClickIds are false', () => {
      const config = createConfig({
        decorateUtm: false,
        decorateClickIds: false,
        customParams: {}
      });
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(Object.keys(params).length).toBe(0);
    });

    it('should trim whitespace from values', () => {
      const config = createConfig({
        customParams: {
          custom: '  value  '
        }
      });
      const data = createIntkData();
      
      const params = getDecorationParams(config, data);
      
      expect(params.custom).toBe('value');
    });
  });

  describe('decorateLink()', () => {
    it('should add parameters to URL without query string', () => {
      const url = 'http://partner.com/page';
      const params = { utm_source: 'google', gclid: '123' };
      
      const result = decorateLink(url, params);
      
      expect(result).toContain('utm_source=google');
      expect(result).toContain('gclid=123');
    });

    it('should add parameters to URL with existing query string', () => {
      const url = 'http://partner.com/page?existing=value';
      const params = { utm_source: 'google' };
      
      const result = decorateLink(url, params);
      
      expect(result).toContain('existing=value');
      expect(result).toContain('utm_source=google');
    });

    it('should not overwrite existing parameters', () => {
      const url = 'http://partner.com/page?utm_source=existing';
      const params = { utm_source: 'new', utm_medium: 'cpc' };
      
      const result = decorateLink(url, params);
      
      expect(result).toContain('utm_source=existing');
      expect(result).not.toContain('utm_source=new');
      expect(result).toContain('utm_medium=cpc');
    });

    it('should preserve hash fragments', () => {
      const url = 'http://partner.com/page#section';
      const params = { utm_source: 'google' };
      
      const result = decorateLink(url, params);
      
      expect(result).toContain('utm_source=google');
      expect(result).toContain('#section');
      // Hash should come after query params
      expect(result.indexOf('#section')).toBeGreaterThan(result.indexOf('utm_source'));
    });

    it('should return original URL when params is empty', () => {
      const url = 'http://partner.com/page';
      
      expect(decorateLink(url, {})).toBe(url);
    });

    it('should return original URL when params is null/undefined', () => {
      const url = 'http://partner.com/page';
      
      expect(decorateLink(url, null as any)).toBe(url);
      expect(decorateLink(url, undefined as any)).toBe(url);
    });

    it('should handle URLs with ports', () => {
      const url = 'http://partner.com:8080/page';
      const params = { utm_source: 'google' };
      
      const result = decorateLink(url, params);
      
      expect(result).toContain(':8080');
      expect(result).toContain('utm_source=google');
    });

    it('should properly encode special characters in values', () => {
      const url = 'http://partner.com/page';
      const params = { utm_campaign: 'hello world', utm_content: 'a=b&c=d' };
      
      const result = decorateLink(url, params);
      
      expect(result).toContain('utm_campaign=hello+world');
      expect(result).toContain('utm_content=a%3Db%26c%3Dd');
    });

    it('should skip empty values', () => {
      const url = 'http://partner.com/page';
      const params = { utm_source: 'google', utm_medium: '' };
      
      const result = decorateLink(url, params);
      
      expect(result).toContain('utm_source=google');
      expect(result).not.toContain('utm_medium');
    });
  });

  describe('initLinkDecoration()', () => {
    const createConfig = (overrides: Partial<ResolvedLinkDecorationConfig> = {}): ResolvedLinkDecorationConfig => ({
      enabled: true,
      allowedDomains: ['partner.com'],
      decorateUtm: true,
      decorateClickIds: true,
      customParams: {},
      ...overrides
    });

    const createIntkData = (): IntkData => ({
      current: {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'test',
        cnt: '',
        trm: ''
      },
      current_add: { fd: '2024-01-01', ep: '/', rf: '(none)' },
      first: {
        typ: 'utm',
        src: 'google',
        mdm: 'cpc',
        cmp: 'test',
        cnt: '',
        trm: ''
      },
      first_add: { fd: '2024-01-01', ep: '/', rf: '(none)' },
      session: { pgs: 1, cpg: '/' },
      udata: { vst: 1, uip: '(none)', uag: 'test' },
      promo: {},
      click_ids: { gclid: 'abc123' }
    });

    it('should return cleanup function', () => {
      const config = createConfig();
      const data = createIntkData();
      
      const cleanup = initLinkDecoration(config, () => data);
      
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should return no-op when not enabled', () => {
      const config = createConfig({ enabled: false });
      const data = createIntkData();
      
      const cleanup = initLinkDecoration(config, () => data);
      
      expect(typeof cleanup).toBe('function');
      cleanup(); // Should not throw
    });

    it('should return no-op when allowedDomains is empty', () => {
      const config = createConfig({ allowedDomains: [] });
      const data = createIntkData();
      
      const cleanup = initLinkDecoration(config, () => data);
      
      expect(typeof cleanup).toBe('function');
    });

    it('should decorate link on click to allowed domain', () => {
      const config = createConfig();
      const data = createIntkData();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = 'http://partner.com/page';
      document.body.appendChild(link);
      
      const cleanup = initLinkDecoration(config, () => data);
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      link.dispatchEvent(clickEvent);
      
      // Check that link was decorated
      expect(link.href).toContain('utm_source=google');
      expect(link.href).toContain('gclid=abc123');
      
      cleanup();
      document.body.removeChild(link);
    });

    it('should not decorate link to non-allowed domain', () => {
      const config = createConfig();
      const data = createIntkData();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = 'http://other.com/page';
      const originalHref = link.href;
      document.body.appendChild(link);
      
      const cleanup = initLinkDecoration(config, () => data);
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      link.dispatchEvent(clickEvent);
      
      // Check that link was not decorated
      expect(link.href).toBe(originalHref);
      
      cleanup();
      document.body.removeChild(link);
    });

    it('should not decorate same-origin links', () => {
      mockLocation('http://partner.com/');
      const config = createConfig();
      const data = createIntkData();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = 'http://partner.com/other-page';
      const originalHref = link.href;
      document.body.appendChild(link);
      
      const cleanup = initLinkDecoration(config, () => data);
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      link.dispatchEvent(clickEvent);
      
      // Check that link was not decorated (same-origin)
      expect(link.href).toBe(originalHref);
      
      cleanup();
      document.body.removeChild(link);
    });

    it('should use current data from getData function', () => {
      const config = createConfig();
      let currentData = createIntkData();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = 'http://partner.com/page';
      document.body.appendChild(link);
      
      const cleanup = initLinkDecoration(config, () => currentData);
      
      // Update data
      currentData = {
        ...currentData,
        current: {
          ...currentData.current,
          src: 'facebook'
        },
        click_ids: {
          fbclid: 'new123'
        }
      };
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      link.dispatchEvent(clickEvent);
      
      // Check that link was decorated with NEW data
      expect(link.href).toContain('utm_source=facebook');
      expect(link.href).toContain('fbclid=new123');
      
      cleanup();
      document.body.removeChild(link);
    });

    it('should stop decorating after cleanup', () => {
      const config = createConfig();
      const data = createIntkData();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = 'http://partner.com/page';
      document.body.appendChild(link);
      
      const cleanup = initLinkDecoration(config, () => data);
      
      // Cleanup immediately
      cleanup();
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      link.dispatchEvent(clickEvent);
      
      // Link should not be decorated
      expect(link.href).not.toContain('utm_source');
      expect(link.href).not.toContain('gclid');
      
      document.body.removeChild(link);
    });

    it('should handle nested elements inside links', () => {
      const config = createConfig();
      const data = createIntkData();
      
      // Create a link with nested span
      const link = document.createElement('a');
      link.href = 'http://partner.com/page';
      const span = document.createElement('span');
      span.textContent = 'Click me';
      link.appendChild(span);
      document.body.appendChild(link);
      
      const cleanup = initLinkDecoration(config, () => data);
      
      // Simulate click on the span
      const clickEvent = new MouseEvent('click', { bubbles: true });
      span.dispatchEvent(clickEvent);
      
      // Check that link was decorated
      expect(link.href).toContain('utm_source=google');
      
      cleanup();
      document.body.removeChild(link);
    });

    it('should not decorate when no params to add', () => {
      const config = createConfig({
        decorateUtm: false,
        decorateClickIds: false
      });
      const data: IntkData = {
        ...createIntkData(),
        click_ids: {}
      };
      
      // Create a link element
      const link = document.createElement('a');
      link.href = 'http://partner.com/page';
      const originalHref = link.href;
      document.body.appendChild(link);
      
      const cleanup = initLinkDecoration(config, () => data);
      
      // Simulate click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      link.dispatchEvent(clickEvent);
      
      // Link should not be modified
      expect(link.href).toBe(originalHref);
      
      cleanup();
      document.body.removeChild(link);
    });
  });
});
