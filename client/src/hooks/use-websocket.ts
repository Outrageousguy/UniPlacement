import { useEffect, useRef, useState, useCallback } from 'react';

interface WSMessage {
  type: string;
  data: any;
}

interface UseWebSocketOptions {
  userId?: number;
  userType?: 'student' | 'coordinator';
  onMessage?: (message: WSMessage) => void;
  onOnlineStatusUpdate?: (onlineUsers: any[]) => void;
  onNewMessage?: (message: any) => void;
  onTyping?: (data: { senderId: number; isTyping: boolean }) => void;
}

export function useWebSocket({
  userId,
  userType,
  onMessage,
  onOnlineStatusUpdate,
  onNewMessage,
  onTyping
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId || !userType) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Authenticate
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId,
          userType
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'authenticated':
              console.log('WebSocket authenticated');
              break;

            case 'online_status_update':
              setOnlineUsers(message.data);
              onOnlineStatusUpdate?.(message.data);
              break;

            case 'new_message':
              onNewMessage?.(message.data);
              break;

            case 'typing':
              onTyping?.(message.data);
              break;

            case 'error':
              console.error('WebSocket error:', message.data);
              break;

            default:
              onMessage?.(message);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [userId, userType, onMessage, onOnlineStatusUpdate, onNewMessage, onTyping]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((type: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const sendChatMessage = useCallback((receiverId: number, content: string) => {
    sendMessage('message', { receiverId, content });
  }, [sendMessage]);

  const sendTyping = useCallback((receiverId: number, isTyping: boolean) => {
    sendMessage('typing', { receiverId, isTyping });
  }, [sendMessage]);

  // Connect when userId and userType are available
  useEffect(() => {
    if (userId && userType) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [userId, userType, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    onlineUsers,
    sendMessage,
    sendChatMessage,
    sendTyping,
    connect,
    disconnect
  };
}