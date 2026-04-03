import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  readParametersFromURL,
  saveToRuntimeMemory,
  readFromRuntimeMemory,
  addParametersToURL,
  initParameterForwarding,
  clearRuntimeMemory
} from '@/privacy/parameter-forwarding';
import { mockLocation } from '../../setup';

describe('privacy/parameter-forwarding', () => {
  beforeEach(() => {
    // Clear window.name before each test
    window.name = '';
    mockLocation('http://localhost/');
  });

  describe('readParametersFromURL()', () => {
    it('should read UTM parameters from URL', () => {
      mockLocation('http://localhost/?utm_source=google&utm_medium=cpc&utm_campaign=test');
      const params = readParametersFromURL();
      
      expect(params).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'test'
      });
    });

    it('should read click IDs from URL', () => {
      mockLocation('http://localhost/?gclid=123&fbclid=456&msclkid=789');
      const params = readParametersFromURL();
      
      expect(params).toEqual({
        gclid: '123',
        fbclid: '456',
        msclkid: '789'
      });
    });

    it('should read both UTM and click IDs', () => {
      mockLocation('http://localhost/?utm_source=google&gclid=123&utm_medium=cpc');
      const params = readParametersFromURL();
      
      expect(params).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        gclid: '123'
      });
    });

    it('should ignore non-tracking parameters', () => {
      mockLocation('http://localhost/?utm_source=google&other_param=value&gclid=123');
      const params = readParametersFromURL();
      
      expect(params).toEqual({
        utm_source: 'google',
        gclid: '123'
      });
      expect(params).not.toHaveProperty('other_param');
    });

    it('should return empty object when no tracking parameters', () => {
      mockLocation('http://localhost/?other_param=value');
      const params = readParametersFromURL();
      
      expect(params).toEqual({});
    });

    it('should trim whitespace from parameter values', () => {
      mockLocation('http://localhost/?utm_source=  google  &gclid=  123  ');
      const params = readParametersFromURL();
      
      expect(params).toEqual({
        utm_source: 'google',
        gclid: '123'
      });
    });
  });

  describe('saveToRuntimeMemory() and readFromRuntimeMemory()', () => {
    it('should save and read parameters from window.name', () => {
      const params = {
        utm_source: 'google',
        gclid: '123'
      };
      
      saveToRuntimeMemory(params);
      const readParams = readFromRuntimeMemory();
      
      expect(readParams).toEqual(params);
    });

    it('should merge with existing parameters', () => {
      // Save initial parameters
      saveToRuntimeMemory({
        utm_source: 'google',
        gclid: '123'
      });
      
      // Add new parameters
      saveToRuntimeMemory({
        utm_medium: 'cpc',
        gclid: '456' // Overwrites old value
      });
      
      const readParams = readFromRuntimeMemory();
      
      expect(readParams).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        gclid: '456' // New value
      });
    });

    it('should filter out empty values', () => {
      saveToRuntimeMemory({
        utm_source: 'google',
        utm_medium: '',
        gclid: '   ' // Whitespace only
      });
      
      const readParams = readFromRuntimeMemory();
      
      expect(readParams).toEqual({
        utm_source: 'google'
      });
    });

    it('should return empty object when window.name is empty', () => {
      window.name = '';
      const params = readFromRuntimeMemory();
      
      expect(params).toEqual({});
    });

    it('should handle invalid JSON gracefully', () => {
      window.name = 'intk_params:invalid json';
      
      // Should return empty object on JSON parse error
      const params = readFromRuntimeMemory();
      
      expect(params).toEqual({});
    });

    it('should ignore data without prefix', () => {
      window.name = 'other_data';
      const params = readFromRuntimeMemory();
      
      expect(params).toEqual({});
    });

    it('should filter out non-tracking parameters', () => {
      // Simulate storage with invalid parameters
      window.name = 'intk_params:{"utm_source":"google","invalid_param":"value"}';
      
      const params = readFromRuntimeMemory();
      
      expect(params).toEqual({
        utm_source: 'google'
      });
      expect(params).not.toHaveProperty('invalid_param');
    });
  });

  describe('addParametersToURL()', () => {
    it('should add parameters to absolute URL', () => {
      const url = 'http://example.com/page';
      const params = {
        utm_source: 'google',
        gclid: '123'
      };
      
      const newUrl = addParametersToURL(url, params);
      
      expect(newUrl).toContain('utm_source=google');
      expect(newUrl).toContain('gclid=123');
    });

    it('should add parameters to URL with existing query string', () => {
      const url = 'http://example.com/page?existing=value';
      const params = {
        utm_source: 'google'
      };
      
      const newUrl = addParametersToURL(url, params);
      
      expect(newUrl).toContain('existing=value');
      expect(newUrl).toContain('utm_source=google');
    });

    it('should not overwrite existing parameters', () => {
      const url = 'http://example.com/page?utm_source=existing';
      const params = {
        utm_source: 'new'
      };
      
      const newUrl = addParametersToURL(url, params);
      
      // Existing parameter should not be overwritten
      expect(newUrl).toContain('utm_source=existing');
      expect(newUrl).not.toContain('utm_source=new');
    });

    it('should handle relative URLs', () => {
      const url = '/page';
      const params = {
        utm_source: 'google'
      };
      
      const newUrl = addParametersToURL(url, params);
      
      expect(newUrl).toContain('utm_source=google');
    });

    it('should filter out empty values', () => {
      const url = 'http://example.com/page';
      const params = {
        utm_source: 'google',
        utm_medium: ''
      };
      
      const newUrl = addParametersToURL(url, params);
      
      expect(newUrl).toContain('utm_source=google');
      expect(newUrl).not.toContain('utm_medium');
    });
  });

  describe('initParameterForwarding()', () => {
    it('should initialize parameter forwarding and return cleanup function', () => {
      mockLocation('http://localhost/?utm_source=google&gclid=123');
      
      const cleanup = initParameterForwarding();
      
      expect(typeof cleanup).toBe('function');
      
      // Verify parameters are saved in runtime memory
      const params = readFromRuntimeMemory();
      expect(params).toHaveProperty('utm_source');
      expect(params).toHaveProperty('gclid');
      
      // Call cleanup
      cleanup();
    });

    it('should merge URL parameters with existing runtime memory', () => {
      // Save parameters to runtime memory
      saveToRuntimeMemory({
        utm_source: 'existing'
      });
      
      mockLocation('http://localhost/?gclid=123');
      
      initParameterForwarding();
      
      const params = readFromRuntimeMemory();
      expect(params).toEqual({
        utm_source: 'existing',
        gclid: '123'
      });
    });

    it('should prioritize URL parameters over runtime memory', () => {
      // Save parameters to runtime memory
      saveToRuntimeMemory({
        utm_source: 'old'
      });
      
      mockLocation('http://localhost/?utm_source=new');
      
      initParameterForwarding();
      
      const params = readFromRuntimeMemory();
      expect(params).toEqual({
        utm_source: 'new' // URL parameter takes priority
      });
    });

    it('should return no-op function when no parameters', () => {
      mockLocation('http://localhost/');
      
      const cleanup = initParameterForwarding();
      
      expect(typeof cleanup).toBe('function');
      
      // Verify runtime memory is empty
      const params = readFromRuntimeMemory();
      expect(Object.keys(params).length).toBe(0);
    });
  });

  describe('clearRuntimeMemory()', () => {
    it('should clear Intake parameters from window.name', () => {
      saveToRuntimeMemory({
        utm_source: 'google',
        gclid: '123'
      });
      
      clearRuntimeMemory();
      
      const params = readFromRuntimeMemory();
      expect(params).toEqual({});
    });

    it('should not affect window.name if it does not contain Intake data', () => {
      window.name = 'other_data';
      
      clearRuntimeMemory();
      
      // window.name should not be modified since it doesn't start with our prefix
      expect(window.name).toBe('other_data');
    });
  });
});

