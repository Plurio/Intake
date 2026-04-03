export function getParam(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

export function getAllParams(): Record<string, string> {
  const urlParams = new URLSearchParams(window.location.search);
  const params: Record<string, string> = {};
  urlParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export function getAllParamsFromUrl(url: string): Record<string, string> {
  try {
    const urlObj = new URL(url, window.location.origin);
    const urlParams = new URLSearchParams(urlObj.search);
    const params: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch (e) {
    // Fallback for relative URLs
    const match = url.match(/\?([^#]*)/);
    if (match) {
      const urlParams = new URLSearchParams(match[1]);
      const params: Record<string, string> = {};
      urlParams.forEach((value, key) => {
        params[key] = value;
      });
      return params;
    }
    return {};
  }
}

export function getHost(url: string): string {
  try {
    const urlObj = new URL(url);
    let host = urlObj.hostname;
    // Remove www. prefix
    if (host.startsWith('www.')) {
      host = host.substring(4);
    }
    return host;
  } catch (e) {
    // Fallback for relative URLs
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : '';
  }
}

export function parseUrl(url: string): { host: string; query: string; path: string } {
  try {
    const urlObj = new URL(url);
    let host = urlObj.hostname;
    // Remove www. prefix
    if (host.startsWith('www.')) {
      host = host.substring(4);
    }
    return {
      host: host,
      query: urlObj.search.substring(1), // Remove leading ?
      path: urlObj.pathname
    };
  } catch (e) {
    // Fallback for relative URLs or invalid URLs
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\?]+)(\/[^\?]*)?(?:\?)?(.*)/);
    if (match) {
      let host = match[1].replace(/^www\./, '');
      return {
        host: host,
        path: match[2] || '/',
        query: match[3] || ''
      };
    }
    // For relative URLs like /path/to/page?param=value
    const relativeMatch = url.match(/^(\/[^\?]*)(?:\?)?(.*)/);
    if (relativeMatch) {
      return {
        host: '',
        path: relativeMatch[1],
        query: relativeMatch[2] || ''
      };
    }
    // Invalid URL
    return {
      host: '',
      path: '/',
      query: ''
    };
  }
}

