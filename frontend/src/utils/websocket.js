/**
 * WebSocket Manager for Real-time Messaging
 * Handles WebSocket connections, reconnection logic, and message handling
 */

class WebSocketManager {
  constructor(conversationId, token, onMessage, onError, onClose) {
    this.conversationId = conversationId;
    this.token = token;
    this.onMessage = onMessage;
    this.onError = onError;
    this.onClose = onClose;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pingInterval = null;
    this.isIntentionallyClosed = false;
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = import.meta.env.VITE_WS_PORT || '8000';

    // Construct WebSocket URL with JWT token as query parameter
    const wsUrl = `${protocol}//${host}:${port}/ws/chat/${this.conversationId}/?token=${this.token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`WebSocket connected to conversation ${this.conversationId}`);
        this.reconnectAttempts = 0;
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError(error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.stopPing();

        if (this.onClose) {
          this.onClose(event);
        }

        // Attempt to reconnect if not intentionally closed
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  handleMessage(data) {
    if (this.onMessage) {
      this.onMessage(data);
    }
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: type,
        ...payload,
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Message not sent:', type, payload);
    }
  }

  sendMessage(content, replyToId = null) {
    this.send('chat_message', {
      content: content,
      reply_to_id: replyToId,
    });
  }

  sendTypingIndicator(isTyping) {
    this.send('typing', {
      is_typing: isTyping,
    });
  }

  sendReadReceipt(messageId) {
    this.send('read_receipt', {
      message_id: messageId,
    });
  }

  editMessage(messageId, content) {
    this.send('edit_message', {
      message_id: messageId,
      content: content,
    });
  }

  deleteMessage(messageId) {
    this.send('delete_message', {
      message_id: messageId,
    });
  }

  pinMessage(messageId, isPinned) {
    this.send('pin_message', {
      message_id: messageId,
      is_pinned: isPinned,
    });
  }

  startPing() {
    // Send periodic ping to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`
      );

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Giving up.');
      if (this.onError) {
        this.onError(new Error('Failed to reconnect after maximum attempts'));
      }
    }
  }

  close() {
    this.isIntentionallyClosed = true;
    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default WebSocketManager;
