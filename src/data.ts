const DELIMITER = '|||';

// Helper functions for promocode
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setLeadingZeroToInt(num: number, size: number): string {
  let s = num.toString();
  while (s.length < size) {
    s = '0' + s;
  }
  return s;
}

export function packMain(source: { typ: string; src: string; mdm: string; cmp: string; cnt: string; trm: string }): string {
  return `typ=${source.typ}${DELIMITER}src=${source.src}${DELIMITER}mdm=${source.mdm}${DELIMITER}cmp=${source.cmp}${DELIMITER}cnt=${source.cnt}${DELIMITER}trm=${source.trm}`;
}

export function packExtra(timezoneOffset: number | null = null): string {
  const now = new Date();
  
  // If timezone_offset is specified, adjust the time
  let dateToUse = now;
  if (timezoneOffset !== null) {
    // Get current offset in minutes
    const currentOffset = -now.getTimezoneOffset(); // minutes
    const targetOffset = timezoneOffset * 60; // convert hours to minutes
    const offsetDiff = targetOffset - currentOffset;
    
    // Create new date with offset applied
    dateToUse = new Date(now.getTime() + offsetDiff * 60 * 1000);
  }
  
  const dateStr = dateToUse.getFullYear() + '-' + 
    String(dateToUse.getMonth() + 1).padStart(2, '0') + '-' + 
    String(dateToUse.getDate()).padStart(2, '0') + ' ' +
    String(dateToUse.getHours()).padStart(2, '0') + ':' +
    String(dateToUse.getMinutes()).padStart(2, '0') + ':' +
    String(dateToUse.getSeconds()).padStart(2, '0');
  
  return `fd=${dateStr}${DELIMITER}ep=${window.location.href}${DELIMITER}rf=${document.referrer || '(none)'}`;
}

export function packSession(pages: number): string {
  return `pgs=${pages}${DELIMITER}cpg=${window.location.href}`;
}

export function packUser(visits: number, userIp: string): string {
  return `vst=${visits}${DELIMITER}uip=${userIp}${DELIMITER}uag=${navigator.userAgent}`;
}

export function packPromo(promocodeConfig: { min: number; max: number }): string {
  const randomCode = randomInt(promocodeConfig.min, promocodeConfig.max);
  const codeLength = promocodeConfig.max.toString().length;
  const paddedCode = setLeadingZeroToInt(randomCode, codeLength);
  return `code=${paddedCode}`;
}

