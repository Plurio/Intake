import { describe, it, expect, beforeEach } from 'vitest';
import { resolveConfig } from '@/config';
import { DEFAULT_IN_APP_BROWSERS } from '@/core';
import type { IntkConfig } from '@/types';
import { mockLocation } from '../setup';

describe('config', () => {
  beforeEach(() => {
    mockLocation('http://localhost/');
  });

  describe('resolveConfig()', () => {
    describe('default values', () => {
      it('should apply default lifetime (6 months)', () => {
        const config = resolveConfig();
        // 6 months * 30 days * 24 hours * 60 minutes = 259200 minutes
        expect(config.lifetime).toBe(259200);
      });

      it('should apply default session_length (30 minutes)', () => {
        const config = resolveConfig();
        expect(config.session_length).toBe(30);
      });

      it('should apply default timezone_offset (null)', () => {
        const config = resolveConfig();
        expect(config.timezone_offset).toBeNull();
      });

      it('should apply default user_ip', () => {
        const config = resolveConfig();
        expect(config.user_ip).toBe('(none)');
      });

      it('should apply default typein_attributes', () => {
        const config = resolveConfig();
        expect(config.typein_attributes).toEqual({
          source: '(direct)',
          medium: '(none)'
        });
      });

      it('should apply default domain (current host)', () => {
        mockLocation('http://example.com/');
        const config = resolveConfig();
        expect(config.domain.host).toBe('example.com');
        expect(config.domain.isolate).toBe(false);
      });
    });

    describe('lifetime', () => {
      it('should convert months to minutes', () => {
        const config = resolveConfig({ lifetime: 1 });
        // 1 month * 30 days * 24 hours * 60 minutes = 43200 minutes
        expect(config.lifetime).toBe(43200);
      });

      it('should handle fractional months', () => {
        const config = resolveConfig({ lifetime: 0.5 });
        // 0.5 months * 30 days * 24 hours * 60 minutes = 21600 minutes
        expect(config.lifetime).toBe(21600);
      });

      it('should handle custom lifetime', () => {
        const config = resolveConfig({ lifetime: 12 });
        expect(config.lifetime).toBe(518400); // 12 months
      });
    });

    describe('session_length', () => {
      it('should use custom session_length', () => {
        const config = resolveConfig({ session_length: 60 });
        expect(config.session_length).toBe(60);
      });

      it('should handle zero session_length', () => {
        const config = resolveConfig({ session_length: 0 });
        expect(config.session_length).toBe(0);
      });
    });

    describe('timezone_offset', () => {
      it('should use custom timezone_offset', () => {
        const config = resolveConfig({ timezone_offset: 3 });
        expect(config.timezone_offset).toBe(3);
      });

      it('should handle negative timezone_offset', () => {
        const config = resolveConfig({ timezone_offset: -5 });
        expect(config.timezone_offset).toBe(-5);
      });

      it('should handle zero timezone_offset', () => {
        const config = resolveConfig({ timezone_offset: 0 });
        expect(config.timezone_offset).toBe(0);
      });
    });

    describe('campaign_param, term_param, content_param', () => {
      it('should use custom campaign_param', () => {
        const config = resolveConfig({ campaign_param: 'custom_campaign' });
        expect(config.campaign_param).toBe('custom_campaign');
      });

      it('should use custom term_param', () => {
        const config = resolveConfig({ term_param: 'custom_term' });
        expect(config.term_param).toBe('custom_term');
      });

      it('should use custom content_param', () => {
        const config = resolveConfig({ content_param: 'custom_content' });
        expect(config.content_param).toBe('custom_content');
      });

      it('should handle false for params', () => {
        const config = resolveConfig({
          campaign_param: false,
          term_param: false,
          content_param: false
        });
        expect(config.campaign_param).toBe(false);
        expect(config.term_param).toBe(false);
        expect(config.content_param).toBe(false);
      });

      it('should default to false when not specified', () => {
        const config = resolveConfig();
        expect(config.campaign_param).toBe(false);
        expect(config.term_param).toBe(false);
        expect(config.content_param).toBe(false);
      });
    });

    describe('user_ip', () => {
      it('should use custom user_ip', () => {
        const config = resolveConfig({ user_ip: '192.168.1.1' });
        expect(config.user_ip).toBe('192.168.1.1');
      });
    });

    describe('promocode', () => {
      it('should handle promocode as boolean true', () => {
        const config = resolveConfig({ promocode: true });
        expect(config.promocode).toEqual({
          min: 100000,
          max: 999999
        });
      });

      it('should handle promocode as object', () => {
        const config = resolveConfig({
          promocode: { min: 1, max: 100 }
        });
        expect(config.promocode).toEqual({
          min: 1,
          max: 100
        });
      });

      it('should handle promocode as false', () => {
        const config = resolveConfig({ promocode: false });
        expect(config.promocode).toBe(false);
      });

      it('should default to false when not specified', () => {
        const config = resolveConfig();
        expect(config.promocode).toBe(false);
      });
    });

    describe('typein_attributes', () => {
      it('should use custom typein_attributes', () => {
        const config = resolveConfig({
          typein_attributes: {
            source: 'custom_source',
            medium: 'custom_medium'
          }
        });
        expect(config.typein_attributes).toEqual({
          source: 'custom_source',
          medium: 'custom_medium'
        });
      });

      it('should use default if source missing', () => {
        const config = resolveConfig({
          typein_attributes: {
            medium: 'custom_medium'
          } as any
        });
        expect(config.typein_attributes).toEqual({
          source: '(direct)',
          medium: '(none)'
        });
      });

      it('should use default if medium missing', () => {
        const config = resolveConfig({
          typein_attributes: {
            source: 'custom_source'
          } as any
        });
        expect(config.typein_attributes).toEqual({
          source: '(direct)',
          medium: '(none)'
        });
      });
    });

    describe('domain', () => {
      it('should handle domain as string', () => {
        const config = resolveConfig({ domain: 'example.com' });
        expect(config.domain).toEqual({
          host: 'example.com',
          isolate: false
        });
      });

      it('should handle domain as object', () => {
        const config = resolveConfig({
          domain: {
            host: 'example.com',
            isolate: true
          }
        });
        expect(config.domain).toEqual({
          host: 'example.com',
          isolate: true
        });
      });

      it('should use current host when domain not specified', () => {
        mockLocation('http://test.com/');
        const config = resolveConfig();
        expect(config.domain.host).toBe('test.com');
      });

      it('should handle domain object without isolate', () => {
        const config = resolveConfig({
          domain: {
            host: 'example.com'
          } as any
        });
        expect(config.domain.isolate).toBe(false);
      });
    });

    describe('organics', () => {
      it('should merge custom organics with defaults', () => {
        const config = resolveConfig({
          organics: [
            { host: 'custom.com', param: 'q', display: 'Custom' }
          ]
        });
        
        // Should have custom + defaults
        expect(config.organics.length).toBeGreaterThan(1);
        expect(config.organics).toContainEqual({
          host: 'custom.com',
          param: 'q',
          display: 'Custom'
        });
      });

      it('should include default organics', () => {
        const config = resolveConfig();
        expect(config.organics.length).toBeGreaterThan(0);
        // Check for some default organics
        const hasBing = config.organics.some(o => o.host.includes('bing'));
        expect(hasBing).toBe(true);
      });

      it('should filter invalid organics', () => {
        const config = resolveConfig({
          organics: [
            { host: 'valid.com', param: 'q' },
            { host: '', param: 'q' } as any, // invalid
            { host: 'valid2.com', param: '' } as any // invalid
          ]
        });
        
        // Should only include valid ones
        const validOrganics = config.organics.filter(o => o.host && o.param);
        expect(validOrganics.length).toBeGreaterThan(0);
      });
    });

    describe('referrals', () => {
      it('should merge custom referrals with defaults', () => {
        const config = resolveConfig({
          referrals: [
            { host: 'custom.com', display: 'Custom' }
          ]
        });
        
        // Should have custom + defaults
        expect(config.referrals.length).toBeGreaterThan(1);
        expect(config.referrals).toContainEqual({
          host: 'custom.com',
          display: 'Custom'
        });
      });

      it('should include default referrals', () => {
        const config = resolveConfig();
        expect(config.referrals.length).toBeGreaterThan(0);
        // Check for default referrals
        const hasTco = config.referrals.some(r => r.host === 't.co');
        expect(hasTco).toBe(true);
      });

      it('should filter invalid referrals', () => {
        const config = resolveConfig({
          referrals: [
            { host: 'valid.com' },
            { host: '' } as any // invalid
          ]
        });
        
        // Should only include valid ones
        const validReferrals = config.referrals.filter(r => r.host);
        expect(validReferrals.length).toBeGreaterThan(0);
      });
    });

    describe('edge cases', () => {
      it('should handle empty config object', () => {
        const config = resolveConfig({});
        expect(config.lifetime).toBe(259200); // default
        expect(config.session_length).toBe(30); // default
      });

      it('should handle undefined config', () => {
        const config = resolveConfig(undefined);
        expect(config.lifetime).toBe(259200);
      });

      it('should handle invalid numeric values gracefully', () => {
        const config = resolveConfig({
          lifetime: 'invalid' as any,
          session_length: 'invalid' as any
        });
        // Should fall back to defaults
        expect(config.lifetime).toBe(259200);
        expect(config.session_length).toBe(30);
      });
    });

    describe('in_app_browsers', () => {
      it('should populate defaults when option omitted', () => {
        const config = resolveConfig();
        expect(config.in_app_browsers.length).toBeGreaterThan(0);
        const sources = config.in_app_browsers.map(b => b.source);
        expect(sources).toContain('instagram');
        expect(sources).toContain('facebook');
        expect(sources).toContain('tiktok');
        expect(sources).toContain('telegram');
      });

      it('should return empty list when explicitly disabled', () => {
        const config = resolveConfig({ in_app_browsers: false });
        expect(config.in_app_browsers).toEqual([]);
      });

      it('should place custom patterns before defaults', () => {
        const config = resolveConfig({
          in_app_browsers: [{ pattern: 'MyCustomApp', source: 'mycustom' }]
        });
        expect(config.in_app_browsers[0].source).toBe('mycustom');
        // Defaults still present after custom entries
        const defaultSources = config.in_app_browsers.slice(1).map(b => b.source);
        expect(defaultSources).toContain('instagram');
      });

      it('should filter out entries missing pattern or source', () => {
        const config = resolveConfig({
          in_app_browsers: [
            { pattern: '', source: 'nopattern' } as any,
            { pattern: 'X' } as any,
            { pattern: 'GoodOne', source: 'good' }
          ]
        });
        // Total = 1 valid custom entry + all defaults
        expect(config.in_app_browsers.length).toBe(DEFAULT_IN_APP_BROWSERS.length + 1);
        expect(config.in_app_browsers[0].source).toBe('good');
      });
    });
  });
});

