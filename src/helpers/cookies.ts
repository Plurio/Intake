export function get(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export function set(name: string, value: string, minutes?: number, domain?: string): void {
  let expires = "";
  if (minutes) {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  const domainPart = domain ? "; domain=" + domain : "";
  document.cookie = name + "=" + value + expires + "; path=/" + domainPart;
}

export function parse(container: string): Record<string, string> {
  const DELIMITER = '|||';
  const data: Record<string, string> = {};
  const parts = container.split(DELIMITER);
  
  for (const part of parts) {
    const equalIndex = part.indexOf('=');
    if (equalIndex === -1) {
      // Skip invalid parts without '='
      continue;
    }
    const key = part.substring(0, equalIndex);
    const value = part.substring(equalIndex + 1);
    if (key) {
      data[key] = value; // Allow empty values
    }
  }
  
  return data;
}

