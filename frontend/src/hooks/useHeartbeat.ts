// src/hooks/useHeartbeat.ts

import { useEffect, useRef } from 'react';
import { usersApi } from '../services/api';

export function useHeartbeat(intervalMinutes: number = 5) {
  // ✅ FIXED: Use ReturnType instead of NodeJS.Timeout
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, intervalMinutes * 60 * 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMinutes]);

  const sendHeartbeat = async () => {
    try {
      await usersApi.heartbeat();
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  };

  return { sendHeartbeat };
}