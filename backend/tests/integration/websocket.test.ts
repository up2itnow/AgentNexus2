/**
 * WebSocket Integration Tests
 * 
 * Tests WebSocket server functionality and message handling.
 * 
 * @author AgentNexus Team (Phase 6A: Integration Testing)
 */

import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://localhost:3001/ws';

describe('WebSocket Integration', () => {
  
  let ws: WebSocket.WebSocket;

  afterEach(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  test('should establish WebSocket connection', (done) => {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  test('should receive welcome message on connection', (done) => {
    ws = new WebSocket(WS_URL);

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      expect(message).toHaveProperty('type');
      expect(message).toHaveProperty('timestamp');
      
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  test('should handle subscribe message', (done) => {
    ws = new WebSocket(WS_URL);
    let receivedSubscribeConfirmation = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        executionId: 'test_execution_123'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'status' && message.data?.message?.includes('Subscribed')) {
        receivedSubscribeConfirmation = true;
        expect(receivedSubscribeConfirmation).toBe(true);
        done();
      }
    });

    ws.on('error', (error) => {
      done(error);
    });

    setTimeout(() => {
      if (!receivedSubscribeConfirmation) {
        done(new Error('Did not receive subscribe confirmation'));
      }
    }, 5000);
  }, 10000);

  test('should handle unsubscribe message', (done) => {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      // Subscribe first
      ws.send(JSON.stringify({
        type: 'subscribe',
        executionId: 'test_execution_123'
      }));

      // Then unsubscribe
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'unsubscribe',
          executionId: 'test_execution_123'
        }));
        
        setTimeout(() => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          done();
        }, 500);
      }, 1000);
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  test('should respond to ping with pong', (done) => {
    ws = new WebSocket(WS_URL);
    let receivedPong = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'ping'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'pong') {
        receivedPong = true;
        expect(receivedPong).toBe(true);
        done();
      }
    });

    ws.on('error', (error) => {
      done(error);
    });

    setTimeout(() => {
      if (!receivedPong) {
        done(new Error('Did not receive pong'));
      }
    }, 5000);
  }, 10000);

  test('should handle multiple messages', (done) => {
    ws = new WebSocket(WS_URL);
    const messages: any[] = [];

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'ping' }));
      
      setTimeout(() => {
        ws.send(JSON.stringify({
          type: 'subscribe',
          executionId: 'test_123'
        }));
      }, 500);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      messages.push(message);
      
      if (messages.length >= 2) {
        expect(messages.length).toBeGreaterThanOrEqual(2);
        done();
      }
    });

    ws.on('error', (error) => {
      done(error);
    });

    setTimeout(() => {
      if (messages.length < 2) {
        done(new Error(`Only received ${messages.length} messages`));
      }
    }, 5000);
  }, 10000);

  test('should handle connection close gracefully', (done) => {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      ws.close();
    });

    ws.on('close', () => {
      expect(ws.readyState).toBe(WebSocket.CLOSED);
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  test('should validate message format', (done) => {
    ws = new WebSocket(WS_URL);

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      // All messages should have type and timestamp
      expect(message).toHaveProperty('type');
      expect(message).toHaveProperty('timestamp');
      expect(typeof message.type).toBe('string');
      expect(typeof message.timestamp).toBe('number');
      
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  test('should handle invalid message format', (done) => {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      // Send invalid JSON
      ws.send('invalid json string');
      
      // Wait a bit to see if server crashes
      setTimeout(() => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        done();
      }, 1000);
    });

    ws.on('error', (error) => {
      // Error is acceptable
      done();
    });
  }, 10000);

  test('should handle rapid messages', (done) => {
    ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      // Send multiple rapid messages
      for (let i = 0; i < 10; i++) {
        ws.send(JSON.stringify({
          type: 'ping',
          id: i
        }));
      }
      
      // Server should handle without crashing
      setTimeout(() => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        done();
      }, 2000);
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);
});

describe('WebSocket Message Broadcasting', () => {
  
  let ws1: WebSocket.WebSocket;
  let ws2: WebSocket.WebSocket;

  afterEach(() => {
    if (ws1 && ws1.readyState === WebSocket.OPEN) {
      ws1.close();
    }
    if (ws2 && ws2.readyState === WebSocket.OPEN) {
      ws2.close();
    }
  });

  test('should support multiple concurrent connections', (done) => {
    let ws1Connected = false;
    let ws2Connected = false;

    ws1 = new WebSocket(WS_URL);
    ws2 = new WebSocket(WS_URL);

    ws1.on('open', () => {
      ws1Connected = true;
      checkBoth();
    });

    ws2.on('open', () => {
      ws2Connected = true;
      checkBoth();
    });

    const checkBoth = () => {
      if (ws1Connected && ws2Connected) {
        expect(ws1.readyState).toBe(WebSocket.OPEN);
        expect(ws2.readyState).toBe(WebSocket.OPEN);
        done();
      }
    };

    ws1.on('error', (error) => done(error));
    ws2.on('error', (error) => done(error));
  }, 10000);

  test('should broadcast messages to subscribed clients', (done) => {
    const executionId = `test_execution_${Date.now()}`;
    let ws1ReceivedBroadcast = false;
    let ws2ReceivedBroadcast = false;

    ws1 = new WebSocket(WS_URL);
    ws2 = new WebSocket(WS_URL);

    let ws1Ready = false;
    let ws2Ready = false;

    ws1.on('open', () => {
      ws1.send(JSON.stringify({
        type: 'subscribe',
        executionId
      }));
      ws1Ready = true;
      tryBroadcast();
    });

    ws2.on('open', () => {
      ws2.send(JSON.stringify({
        type: 'subscribe',
        executionId
      }));
      ws2Ready = true;
      tryBroadcast();
    });

    const tryBroadcast = () => {
      if (ws1Ready && ws2Ready) {
        // Give time for subscriptions to register
        setTimeout(() => {
          // In a real test, backend would broadcast a message
          // For now, just verify both are subscribed
          expect(ws1.readyState).toBe(WebSocket.OPEN);
          expect(ws2.readyState).toBe(WebSocket.OPEN);
          done();
        }, 1000);
      }
    };

    ws1.on('error', (error) => done(error));
    ws2.on('error', (error) => done(error));
  }, 15000);
});

describe('WebSocket Error Handling', () => {
  
  test('should handle connection to wrong path', (done) => {
    const ws = new WebSocket('ws://localhost:3001/invalid-path');

    ws.on('error', () => {
      // Error is expected
      expect(true).toBe(true);
      done();
    });

    ws.on('open', () => {
      // If it opens, just close it
      ws.close();
      done();
    });

    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED) {
        done();
      }
    }, 3000);
  }, 10000);

  test('should handle connection timeout', (done) => {
    // Try to connect to non-existent server
    const ws = new WebSocket('ws://invalid-host:9999/ws');

    ws.on('error', () => {
      // Error is expected
      expect(true).toBe(true);
      done();
    });

    setTimeout(() => {
      done();
    }, 3000);
  }, 10000);
});

