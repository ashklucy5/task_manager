// src/hooks/useHeartbeat.ts

import { useEffect, useRef } from 'react';
import { usersApi } from '../services/api';

/**
 * Heartbeat hook - sends ping to server every 5 seconds
 * to indicate user is still online (like Messenger/WhatsApp)
 * 
 * Features:
 * - Sends heartbeat every 5 seconds when tab is visible
 * - Stops sending when tab is hidden
 * - Sets user offline on page unload/visibility change
 * - Handles network errors gracefully
 */
export function useHeartbeat(intervalSeconds: number = 5) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isVisibleRef = useRef(true);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;
    
    // Send initial heartbeat immediately
    sendHeartbeat();

    // Set up interval (every 5 seconds by default)
    intervalRef.current = setInterval(sendHeartbeat, intervalSeconds * 1000);

    // Track page visibility
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      
      // If page becomes visible again, send heartbeat immediately
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    // Send final heartbeat on page unload
    const handleBeforeUnload = () => {
      if (!isUnmountedRef.current) {
        setOffline();
      }
    };

    // Handle window blur (user switched tabs/apps)
    const handleBlur = () => {
      // Optional: Could set offline immediately or after delay
      // For now, we rely on visibilitychange
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBlur);

    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Send final offline signal
      setOffline();
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBlur);
    };
  }, [intervalSeconds]);

  const sendHeartbeat = async () => {
    // Don't send heartbeat if:
    // - Tab is hidden
    // - Component is unmounted
    if (!isVisibleRef.current || isUnmountedRef.current) return;
    
    try {
      await usersApi.heartbeat();
    } catch (error) {
      // Log but don't spam console
      if (import.meta.env.DEV) {
        console.error('Heartbeat failed:', error);
      }
    }
  };

  const setOffline = async () => {
    // Don't set offline if component is unmounted
    if (isUnmountedRef.current) return;
    
    try {
      await usersApi.setOffline();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Set offline failed:', error);
      }
    }
  };

  return { sendHeartbeat, setOffline };
}