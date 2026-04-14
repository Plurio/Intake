'use client';

import { useEffect, useState } from 'react';

export interface IntkSource {
  typ: string;
  src: string;
  mdm: string;
  cmp: string;
  cnt: string;
  trm: string;
}

export interface IntkExtra {
  fd: string;
  ep: string;
  rf: string;
}

export interface IntkSession {
  pgs: number | string;
  cpg: string;
}

export interface IntkUdata {
  vst: number | string;
  uag: string;
  uip?: string;
}

export interface IntkTouchpoint {
  typ: string;
  src: string;
  mdm: string;
  cmp: string;
  ts: number;
}

export interface IntkData {
  current: IntkSource;
  current_add: IntkExtra;
  first: IntkSource;
  first_add: IntkExtra;
  session: IntkSession;
  udata: IntkUdata;
  touchpoints?: { touchpoints: IntkTouchpoint[] };
  click_ids?: Record<string, string>;
}

declare global {
  interface Window {
    intk: {
      init: (config?: any) => void;
      get: IntkData;
      getAttribution: (model: string) => any;
    };
  }
}

export function useIntakeData(): IntkData | null {
  const [data, setData] = useState<IntkData | null>(null);

  useEffect(() => {
    function tryInit() {
      if (typeof window !== 'undefined' && window.intk) {
        window.intk.init({
          domain: window.location.hostname,
          callback: function () {
            setData({ ...window.intk.get });
          },
        });
        if (window.intk.get?.current) {
          setData({ ...window.intk.get });
        }
      } else {
        setTimeout(tryInit, 200);
      }
    }
    tryInit();
  }, []);

  return data;
}
