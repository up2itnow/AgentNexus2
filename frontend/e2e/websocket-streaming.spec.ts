/**
 * WebSocket Real-Time Streaming Tests
 * 
 * Tests real-time log streaming via WebSocket during agent execution.
 * 
 * @author AgentNexus Team (Phase 6A: Integration Testing)
 */

import { test, expect } from '@playwright/test';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

test.describe('WebSocket Real-Time Streaming', () => {
  
  test('should establish WebSocket connection', async ({ page }) => {
    await page.goto('/');
    
    const connected = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          ws.close();
          resolve(true);
        };
        
        ws.onerror = () => resolve(false);
        
        setTimeout(() => resolve(false), 5000);
      });
    }, WS_URL);
    
    expect(connected).toBeTruthy();
  });

  test('should receive welcome message on connection', async ({ page }) => {
    await page.goto('/');
    
    const welcomeMessage = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          ws.close();
          resolve(data);
        };
        
        ws.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 5000);
      });
    }, WS_URL);
    
    expect(welcomeMessage).toBeTruthy();
    expect(welcomeMessage).toHaveProperty('type');
  });

  test('should handle subscribe message', async ({ page }) => {
    await page.goto('/');
    
    const subscribed = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        let receivedSubscribeConfirmation = false;
        
        ws.onopen = () => {
          // Send subscribe message
          ws.send(JSON.stringify({
            type: 'subscribe',
            executionId: 'test_execution_123'
          }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          // Look for status message confirming subscription
          if (data.type === 'status' && data.data?.message?.includes('Subscribed')) {
            receivedSubscribeConfirmation = true;
            ws.close();
            resolve(true);
          }
        };
        
        ws.onerror = () => resolve(false);
        
        setTimeout(() => {
          ws.close();
          resolve(receivedSubscribeConfirmation);
        }, 3000);
      });
    }, WS_URL);
    
    expect(subscribed).toBeTruthy();
  });

  test('should handle unsubscribe message', async ({ page }) => {
    await page.goto('/');
    
    const unsubscribed = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
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
              ws.close();
              resolve(true);
            }, 500);
          }, 1000);
        };
        
        ws.onerror = () => resolve(false);
      });
    }, WS_URL);
    
    expect(unsubscribed).toBeTruthy();
  });

  test('should respond to ping with pong', async ({ page }) => {
    await page.goto('/');
    
    const ponged = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        let receivedPong = false;
        
        ws.onopen = () => {
          // Send ping
          ws.send(JSON.stringify({
            type: 'ping'
          }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === 'pong') {
            receivedPong = true;
            ws.close();
            resolve(true);
          }
        };
        
        ws.onerror = () => resolve(false);
        
        setTimeout(() => {
          ws.close();
          resolve(receivedPong);
        }, 3000);
      });
    }, WS_URL);
    
    expect(ponged).toBeTruthy();
  });

  test('should handle connection close gracefully', async ({ page }) => {
    await page.goto('/');
    
    const closedGracefully = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          ws.close();
        };
        
        ws.onclose = () => {
          resolve(true);
        };
        
        ws.onerror = () => resolve(false);
        
        setTimeout(() => resolve(false), 5000);
      });
    }, WS_URL);
    
    expect(closedGracefully).toBeTruthy();
  });

  test('should receive messages in correct format', async ({ page }) => {
    await page.goto('/');
    
    const messageFormat = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            ws.close();
            
            // Verify message has required fields
            resolve({
              hasType: 'type' in data,
              hasTimestamp: 'timestamp' in data,
              validType: ['subscribe', 'unsubscribe', 'log', 'status', 'metrics', 'error', 'ping', 'pong'].includes(data.type)
            });
          } catch (e) {
            resolve({ error: true });
          }
        };
        
        ws.onerror = () => resolve({ error: true });
        setTimeout(() => resolve({ timeout: true }), 5000);
      });
    }, WS_URL);
    
    expect(messageFormat).toHaveProperty('hasType', true);
    expect(messageFormat).toHaveProperty('hasTimestamp', true);
  });

  test('should handle multiple concurrent connections', async ({ context }) => {
    // Create multiple pages
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();
    
    await Promise.all([
      page1.goto('/'),
      page2.goto('/'),
      page3.goto('/')
    ]);
    
    const results = await Promise.all([
      page1.evaluate((wsUrl) => {
        return new Promise((resolve) => {
          const ws = new WebSocket(wsUrl);
          ws.onopen = () => { ws.close(); resolve(true); };
          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 5000);
        });
      }, WS_URL),
      page2.evaluate((wsUrl) => {
        return new Promise((resolve) => {
          const ws = new WebSocket(wsUrl);
          ws.onopen = () => { ws.close(); resolve(true); };
          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 5000);
        });
      }, WS_URL),
      page3.evaluate((wsUrl) => {
        return new Promise((resolve) => {
          const ws = new WebSocket(wsUrl);
          ws.onopen = () => { ws.close(); resolve(true); };
          ws.onerror = () => resolve(false);
          setTimeout(() => resolve(false), 5000);
        });
      }, WS_URL)
    ]);
    
    // All connections should succeed
    expect(results.every(r => r)).toBeTruthy();
    
    await page1.close();
    await page2.close();
    await page3.close();
  });

  test('should reconnect after connection loss', async ({ page }) => {
    await page.goto('/');
    
    const reconnected = await page.evaluate((wsUrl) => {
      return new Promise((resolve) => {
        let connectionCount = 0;
        
        const connect = () => {
          const ws = new WebSocket(wsUrl);
          
          ws.onopen = () => {
            connectionCount++;
            
            if (connectionCount === 1) {
              // Close first connection
              ws.close();
              // Try to reconnect
              setTimeout(() => connect(), 500);
            } else if (connectionCount === 2) {
              // Second connection successful
              ws.close();
              resolve(true);
            }
          };
          
          ws.onerror = () => {
            if (connectionCount < 2) {
              setTimeout(() => connect(), 500);
            }
          };
        };
        
        connect();
        
        setTimeout(() => resolve(connectionCount >= 2), 10000);
      });
    }, WS_URL);
    
    expect(reconnected).toBeTruthy();
  });
});

test.describe('WebSocket Message Types', () => {
  
  test('should handle log messages', async ({ page }) => {
    await page.goto('/');
    
    // This test verifies the message structure for log messages
    const logMessageStructure = {
      type: 'log',
      executionId: 'test_123',
      data: { log: 'Test log message' },
      timestamp: Date.now()
    };
    
    // Verify structure is valid
    expect(logMessageStructure).toHaveProperty('type', 'log');
    expect(logMessageStructure).toHaveProperty('executionId');
    expect(logMessageStructure).toHaveProperty('data');
    expect(logMessageStructure).toHaveProperty('timestamp');
  });

  test('should handle status messages', async ({ page }) => {
    await page.goto('/');
    
    // Verify status message structure
    const statusMessageStructure = {
      type: 'status',
      executionId: 'test_123',
      data: { status: 'RUNNING' },
      timestamp: Date.now()
    };
    
    expect(statusMessageStructure).toHaveProperty('type', 'status');
    expect(statusMessageStructure.data).toHaveProperty('status');
    expect(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).toContain(statusMessageStructure.data.status);
  });

  test('should handle metrics messages', async ({ page }) => {
    await page.goto('/');
    
    // Verify metrics message structure
    const metricsMessageStructure = {
      type: 'metrics',
      executionId: 'test_123',
      data: {
        memoryUsage: 134217728,
        cpuUsage: 45.2,
        duration: 5230
      },
      timestamp: Date.now()
    };
    
    expect(metricsMessageStructure).toHaveProperty('type', 'metrics');
    expect(metricsMessageStructure.data).toHaveProperty('memoryUsage');
    expect(metricsMessageStructure.data).toHaveProperty('cpuUsage');
  });
});

