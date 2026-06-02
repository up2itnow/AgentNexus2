import http from 'node:http';
import api from './api';
import {
  getBackendBaseUrl,
  getAuthTokenForSession,
  persistBackendBaseUrl,
  setAuthTokenForSession,
} from './client-settings';

const backendUrlKeys = [
  'backend_base_url',
  'agentnexus_backend_url',
  'api_url',
  'agentnexus_api_endpoint',
];

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address());
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

beforeEach(() => {
  window.localStorage.clear();
  setAuthTokenForSession('');
});

describe('client settings', () => {
  it('keeps all backend URL storage aliases consistent', () => {
    persistBackendBaseUrl('  https://api.example.test  ');

    expect(getBackendBaseUrl()).toBe('https://api.example.test');
    for (const key of backendUrlKeys) {
      expect(window.localStorage.getItem(key)).toBe('https://api.example.test');
    }
  });

  it('reads backend URL values saved by recent settings screens', () => {
    window.localStorage.setItem('agentnexus_backend_url', 'https://settings-page.example.test');

    expect(getBackendBaseUrl()).toBe('https://settings-page.example.test');
  });

  it('forwards the in-memory auth token and configured backend URL on API requests', async () => {
    let receivedRequest;
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', 'http://localhost');
      res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      receivedRequest = req;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('[]');
    });

    const address = await listen(server);
    persistBackendBaseUrl(`http://127.0.0.1:${address.port}`);
    setAuthTokenForSession('protected-token');

    try {
      await api.get('/agents');
    } finally {
      await close(server);
    }

    expect(receivedRequest.url).toBe('/api/agents');
    expect(receivedRequest.headers.authorization).toBe('Bearer protected-token');
    expect(getAuthTokenForSession()).toBe('protected-token');
  });
});

