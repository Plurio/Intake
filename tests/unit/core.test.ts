import { describe, it, expect, beforeEach } from 'vitest';
import { detectTrafficSource } from '@/core';
import type { TrafficSource } from '@/types';
import { mockLocation, mockReferrer } from '../setup';

describe('core', () => {
  beforeEach(() => {
    mockLocation('http://localhost/');
    mockReferrer('');
  });

  describe('detectTrafficSource()', () => {
    describe('UTM traffic', () => {
      it('should detect UTM source', () => {
        mockLocation('http://localhost/?utm_source=google');
        const result = detectTrafficSource();
        expect(result.typ).toBe('utm');
        expect(result.src).toBe('google');
      });

      it('should detect all UTM parameters', () => {
        mockLocation('http://localhost/?utm_source=google&utm_medium=cpc&utm_campaign=test&utm_content=banner&utm_term=keyword');
        const result = detectTrafficSource();
        expect(result.typ).toBe('utm');
        expect(result.src).toBe('google');
        expect(result.mdm).toBe('cpc');
        expect(result.cmp).toBe('test');
        expect(result.cnt).toBe('banner');
        expect(result.trm).toBe('keyword');
      });

      it('should handle partial UTM parameters', () => {
        mockLocation('http://localhost/?utm_source=google&utm_medium=cpc');
        const result = detectTrafficSource();
        expect(result.typ).toBe('utm');
        expect(result.src).toBe('google');
        expect(result.mdm).toBe('cpc');
        expect(result.cmp).toBe('(none)');
      });

      it('should use custom campaign_param', () => {
        mockLocation('http://localhost/?utm_source=google&custom_campaign=mycampaign');
        const result = detectTrafficSource(false, [], [], { source: '(direct)', medium: '(none)' }, 'custom_campaign');
        expect(result.cmp).toBe('mycampaign');
      });

      it('should use custom term_param', () => {
        mockLocation('http://localhost/?utm_source=google&custom_term=myterm');
        const result = detectTrafficSource(false, [], [], { source: '(direct)', medium: '(none)' }, false, 'custom_term');
        expect(result.trm).toBe('myterm');
      });

      it('should use custom content_param', () => {
        mockLocation('http://localhost/?utm_source=google&custom_content=mycontent');
        const result = detectTrafficSource(false, [], [], { source: '(direct)', medium: '(none)' }, false, false, 'custom_content');
        expect(result.cnt).toBe('mycontent');
      });
    });

    describe('Click IDs detection', () => {
      describe('gclid (legacy)', () => {
        it('should detect gclid and set source to google', () => {
          mockLocation('http://localhost/?gclid=abc123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('google');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('google_cpc');
        });

        it('should prioritize utm_source over gclid', () => {
          mockLocation('http://localhost/?utm_source=facebook&gclid=abc123');
          const result = detectTrafficSource();
          expect(result.src).toBe('facebook');
        });

        it('should use utm_campaign over google_cpc when gclid present', () => {
          mockLocation('http://localhost/?gclid=abc123&utm_campaign=mycampaign');
          const result = detectTrafficSource();
          expect(result.cmp).toBe('mycampaign');
        });
      });

      describe('Facebook Ads (fbclid)', () => {
        it('should detect fbclid and set source to facebook', () => {
          mockLocation('http://localhost/?fbclid=fb123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('facebook');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('facebook_cpc');
        });

        it('should prioritize utm_source over fbclid', () => {
          mockLocation('http://localhost/?utm_source=google&fbclid=fb123');
          const result = detectTrafficSource();
          expect(result.src).toBe('google');
        });
      });

      describe('Microsoft Ads (msclkid)', () => {
        it('should detect msclkid and set source to microsoft', () => {
          mockLocation('http://localhost/?msclkid=ms123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('microsoft');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('microsoft_cpc');
        });
      });

      describe('TikTok Ads (ttclid)', () => {
        it('should detect ttclid and set source to tiktok', () => {
          mockLocation('http://localhost/?ttclid=tt123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('tiktok');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('tiktok_cpc');
        });
      });

      describe('LinkedIn Ads (li_fatid)', () => {
        it('should detect li_fatid and set source to linkedin', () => {
          mockLocation('http://localhost/?li_fatid=li123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('linkedin');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('linkedin_cpc');
        });
      });

      describe('Twitter/X Ads (twclid)', () => {
        it('should detect twclid and set source to twitter', () => {
          mockLocation('http://localhost/?twclid=tw123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('twitter');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('twitter_cpc');
        });
      });

      describe('Snapchat Ads (snapclid)', () => {
        it('should detect snapclid and set source to snapchat', () => {
          mockLocation('http://localhost/?snapclid=snap123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('snapchat');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('snapchat_cpc');
        });
      });

      describe('Pinterest Ads (pclid)', () => {
        it('should detect pclid and set source to pinterest', () => {
          mockLocation('http://localhost/?pclid=p123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('pinterest');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('pinterest_cpc');
        });
      });

      describe('Google Ads additional identifiers', () => {
        it('should detect wbraid and set source to google', () => {
          mockLocation('http://localhost/?wbraid=wb123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('google');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('google_cpc');
        });

        it('should detect gbraid and set source to google', () => {
          mockLocation('http://localhost/?gbraid=gb123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('google');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('google_cpc');
        });

        it('should detect dclid and set source to google with dv360 campaign', () => {
          mockLocation('http://localhost/?dclid=dc123');
          const result = detectTrafficSource();
          expect(result.typ).toBe('utm');
          expect(result.src).toBe('google');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('google_dv360');
        });
      });

      describe('Click ID priority', () => {
        it('should use first click ID found when multiple present', () => {
          // gclid comes first in the mapping, so it should be used
          mockLocation('http://localhost/?fbclid=fb123&msclkid=ms123&gclid=g123');
          const result = detectTrafficSource();
          expect(result.src).toBe('google'); // gclid is checked first
          expect(result.cmp).toBe('google_cpc');
        });

        it('should use click ID as fallback when utm_medium missing', () => {
          mockLocation('http://localhost/?utm_source=test&fbclid=fb123');
          const result = detectTrafficSource();
          expect(result.src).toBe('test'); // utm_source takes priority
          expect(result.mdm).toBe('cpc'); // fbclid provides medium fallback
        });

        it('should use click ID campaign as fallback when utm_campaign missing', () => {
          mockLocation('http://localhost/?utm_source=test&utm_medium=cpc&msclkid=ms123');
          const result = detectTrafficSource();
          expect(result.src).toBe('test');
          expect(result.mdm).toBe('cpc');
          expect(result.cmp).toBe('microsoft_cpc'); // msclkid provides campaign fallback
        });
      });
    });

    describe('Organic traffic', () => {
      it('should detect Google organic', () => {
        mockLocation('http://localhost/');
        mockReferrer('https://www.google.com/search?q=test');
        const result = detectTrafficSource();
        expect(result.typ).toBe('organic');
        expect(result.src).toBe('google');
        expect(result.mdm).toBe('organic');
      });

      it('should detect Bing organic', () => {
        mockLocation('http://localhost/');
        mockReferrer('https://www.bing.com/search?q=test');
        const result = detectTrafficSource();
        expect(result.typ).toBe('organic');
        expect(result.src).toBe('bing');
      });

      it('should detect custom organic source', () => {
        mockLocation('http://localhost/');
        mockReferrer('https://custom-search.com/search?q=test');
        const customOrganics = [
          { host: 'custom-search.com', param: 'q', display: 'Custom Search' }
        ];
        const result = detectTrafficSource(false, [], customOrganics);
        expect(result.typ).toBe('organic');
        expect(result.src).toBe('Custom Search');
      });

      it('should not detect organic from same domain', () => {
        mockLocation('http://localhost/page2');
        mockReferrer('http://localhost/page1');
        const result = detectTrafficSource();
        // Should be typein, not organic
        expect(result.typ).toBe('typein');
      });
    });

    describe('Referral traffic', () => {
      it('should detect referral traffic', () => {
        mockLocation('http://localhost/');
        mockReferrer('https://example.com/page');
        const result = detectTrafficSource();
        expect(result.typ).toBe('referral');
        expect(result.src).toBe('example.com');
        expect(result.mdm).toBe('referral');
      });

      it('should not update referral if session exists', () => {
        mockLocation('http://localhost/');
        mockReferrer('https://example.com/page');
        // First visit - should be referral
        const result1 = detectTrafficSource(false);
        expect(result1.typ).toBe('referral');
        
        // Second visit with session - should keep old source (typein)
        const result2 = detectTrafficSource(true);
        expect(result2.typ).toBe('typein'); // Falls back to typein when session exists
      });

      it('should detect custom referral with display name', () => {
        mockLocation('http://localhost/');
        mockReferrer('https://t.co/abc123');
        const customReferrals = [
          { host: 't.co', display: 'twitter.com' }
        ];
        const result = detectTrafficSource(false, customReferrals);
        expect(result.typ).toBe('referral');
        expect(result.src).toBe('twitter.com');
      });

      it('should use custom referral medium', () => {
        mockLocation('http://localhost/');
        mockReferrer('https://partner.com/page');
        const customReferrals = [
          { host: 'partner.com', display: 'Partner', medium: 'affiliate' }
        ];
        const result = detectTrafficSource(false, customReferrals);
        expect(result.mdm).toBe('affiliate');
      });
    });

    describe('Typein traffic', () => {
      it('should detect typein when no referrer', () => {
        mockLocation('http://localhost/');
        mockReferrer('');
        const result = detectTrafficSource();
        expect(result.typ).toBe('typein');
        expect(result.src).toBe('(direct)');
        expect(result.mdm).toBe('(none)');
      });

      it('should use custom typein attributes', () => {
        mockLocation('http://localhost/');
        mockReferrer('');
        const typeinAttributes = {
          source: 'direct_visit',
          medium: 'direct'
        };
        const result = detectTrafficSource(false, [], [], typeinAttributes);
        expect(result.typ).toBe('typein');
        expect(result.src).toBe('direct_visit');
        expect(result.mdm).toBe('direct');
      });

      it('should detect typein when referrer is same domain', () => {
        mockLocation('http://localhost/page2');
        mockReferrer('http://localhost/page1');
        const result = detectTrafficSource();
        expect(result.typ).toBe('typein');
      });
    });

    describe('Priority order', () => {
      it('should prioritize UTM over organic', () => {
        mockLocation('http://localhost/?utm_source=google');
        mockReferrer('https://www.bing.com/search?q=test');
        const result = detectTrafficSource();
        expect(result.typ).toBe('utm');
        expect(result.src).toBe('google');
      });

      it('should prioritize UTM over referral', () => {
        mockLocation('http://localhost/?utm_source=google');
        mockReferrer('https://example.com/page');
        const result = detectTrafficSource();
        expect(result.typ).toBe('utm');
      });

      it('should prioritize gclid over organic', () => {
        mockLocation('http://localhost/?gclid=abc123');
        mockReferrer('https://www.bing.com/search?q=test');
        const result = detectTrafficSource();
        expect(result.typ).toBe('utm');
        expect(result.src).toBe('google');
      });
    });

    describe('Edge cases', () => {
      it('should handle empty URL parameters', () => {
        mockLocation('http://localhost/');
        mockReferrer('');
        const result = detectTrafficSource();
        expect(result.typ).toBe('typein');
      });

      it('should handle empty utm_source', () => {
        // Empty utm_source still triggers UTM detection, but source becomes '(none)'
        mockLocation('http://localhost/?utm_source=&utm_medium=cpc');
        const result = detectTrafficSource();
        expect(result.typ).toBe('utm');
        expect(result.src).toBe('(none)'); // Empty string becomes '(none)'
      });

      it('should handle URL-encoded parameters', () => {
        mockLocation('http://localhost/?utm_source=hello%20world&utm_term=test%2Bterm');
        const result = detectTrafficSource();
        expect(result.src).toBe('hello world');
        expect(result.trm).toBe('test+term');
      });
    });
  });
});

