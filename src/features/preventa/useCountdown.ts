import { useState, useEffect } from 'react';

export interface CountdownTick {
  d: number;
  h: number;
  m: number;
  s: number;
  done: boolean;
}

export function useCountdown(targetMs: number): CountdownTick {
  const calc = (): CountdownTick => {
    const diff = Math.max(0, targetMs - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      done: diff === 0,
    };
  };

  const [tick, setTick] = useState<CountdownTick>(calc);

  useEffect(() => {
    const id = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return tick;
}
