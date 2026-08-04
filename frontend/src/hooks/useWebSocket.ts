import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketHookOptions {
  onMessage?: (event: MessageEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (url: string | null, options: WebSocketHookOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<any>(null); // Uses any to support NodeJS and browser timers

  const {
    onMessage,
    onConnect,
    onDisconnect,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const connect = useCallback(() => {
    if (!url) return;

    // Close any previous instances
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
      if (onConnect) onConnect();
    };

    ws.onmessage = (event) => {
      if (onMessage) onMessage(event);
    };

    ws.onerror = (event) => {
      setError(event);
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (onDisconnect) onDisconnect();

      // Trigger automatic reconnection if attempts are under max threshold
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        console.log(
          `WebSocket connection closed. Reconnecting attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${reconnectInterval}ms...`
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    };
  }, [url, onMessage, onConnect, onDisconnect, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        // Clear listeners to avoid trigger callbacks on component unmount
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        typeof message === 'string' ? message : JSON.stringify(message)
      );
    } else {
      console.warn('WebSocket connection is not active. Message could not be sent.');
    }
  }, []);

  return { isConnected, error, sendMessage };
};
