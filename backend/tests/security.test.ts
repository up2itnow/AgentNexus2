/**
 * Security Tests
 * 
 * Tests for input sanitization, log sanitization, and injection detection.
 */

import {
  sanitizeInput,
  sanitizeLogs,
  validateInput,
  detectInjection,
  createSafeSummary
} from '../src/utils/sanitization';

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove null bytes', () => {
      const input = 'test\0string';
      const result = sanitizeInput(input);
      expect(result).toBe('teststring');
    });

    it('should remove control characters', () => {
      const input = 'test\x01\x02\x03string';
      const result = sanitizeInput(input);
      expect(result).toBe('teststring');
    });

    it('should preserve newlines and tabs', () => {
      const input = 'test\n\tstring';
      const result = sanitizeInput(input);
      expect(result).toBe('test\n\tstring');
    });

    it('should handle nested objects', () => {
      const input = {
        name: 'test\0user',
        data: {
          value: 'nested\x01data'
        }
      };
      const result = sanitizeInput(input);
      expect(result.name).toBe('testuser');
      expect(result.data.value).toBe('nesteddata');
    });

    it('should handle arrays', () => {
      const input = ['test\0', 'string\x01', 'array'];
      const result = sanitizeInput(input);
      expect(result).toEqual(['test', 'string', 'array']);
    });

    it('should limit string length', () => {
      const input = 'a'.repeat(200000);
      const result = sanitizeInput(input);
      expect(result.length).toBeLessThanOrEqual(100000);
    });
  });

  describe('detectInjection', () => {
    it('should detect command injection attempts', () => {
      expect(detectInjection('test; rm -rf /')).toBe(true);
      expect(detectInjection('test | cat /etc/passwd')).toBe(true);
      expect(detectInjection('test && echo hack')).toBe(true);
      expect(detectInjection('test`whoami`')).toBe(true);
      expect(detectInjection('test$(whoami)')).toBe(true);
    });

    it('should detect path traversal', () => {
      expect(detectInjection('../../../etc/passwd')).toBe(true);
      expect(detectInjection('../../config.json')).toBe(true);
    });

    it('should allow safe strings', () => {
      expect(detectInjection('Hello, world!')).toBe(false);
      expect(detectInjection('user@example.com')).toBe(false);
      expect(detectInjection('1234567890')).toBe(false);
    });
  });
});

describe('Log Sanitization', () => {
  describe('sanitizeLogs', () => {
    it('should redact API keys', () => {
      const log = 'API_KEY=sk_live_abc123def456ghi789';
      const result = sanitizeLogs(log);
      expect(result).toContain('***REDACTED***');
      expect(result).not.toContain('sk_live_abc123');
    });

    it('should redact AWS credentials', () => {
      const log = 'AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE';
      const result = sanitizeLogs(log);
      expect(result).toContain('***REDACTED***');
      expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    it('should redact JWT tokens', () => {
      const log = 'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
      const result = sanitizeLogs(log);
      expect(result).toContain('***REDACTED***');
    });

    it('should redact private keys', () => {
      const log = '-----BEGIN RSA PRIVATE KEY-----\nMIIEvwIBADANBg';
      const result = sanitizeLogs(log);
      expect(result).toContain('***REDACTED***');
    });

    it('should redact database URLs', () => {
      const log = 'DB=postgres://user:password@localhost/db';
      const result = sanitizeLogs(log);
      expect(result).toContain('***REDACTED***');
      expect(result).not.toContain('password');
    });

    it('should redact email addresses', () => {
      const log = 'User email: user@example.com';
      const result = sanitizeLogs(log);
      expect(result).toContain('***REDACTED***');
    });

    it('should redact internal IPs', () => {
      const log = 'Server: 192.168.1.100';
      const result = sanitizeLogs(log);
      expect(result).toContain('***REDACTED***');
    });

    it('should redact environment variables with secrets', () => {
      const log = 'SECRET_KEY=my_secret_value TOKEN=abc123';
      const result = sanitizeLogs(log);
      expect(result).toContain('SECRET_KEY=***REDACTED***');
      expect(result).toContain('TOKEN=***REDACTED***');
    });

    it('should preserve safe log messages', () => {
      const log = 'Agent execution completed successfully in 2.5s';
      const result = sanitizeLogs(log);
      expect(result).toBe(log);
    });
  });

  describe('createSafeSummary', () => {
    it('should create safe summary of input', () => {
      const input = {
        query: 'test query',
        apiKey: 'sk_live_secret123'
      };
      const summary = createSafeSummary(input);
      expect(summary).toContain('test query');
      expect(summary).toContain('***REDACTED***');
      expect(summary).not.toContain('sk_live_secret123');
    });

    it('should limit summary length', () => {
      const input = { data: 'a'.repeat(1000) };
      const summary = createSafeSummary(input);
      expect(summary.length).toBeLessThanOrEqual(500);
    });
  });
});

describe('Input Validation', () => {
  describe('validateInput', () => {
    it('should validate required fields', () => {
      const schema = {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };

      const validInput = { name: 'John', age: 30 };
      const result1 = validateInput(validInput, schema);
      expect(result1.valid).toBe(true);
      expect(result1.errors).toHaveLength(0);

      const invalidInput = { name: 'John' };
      const result2 = validateInput(invalidInput, schema);
      expect(result2.valid).toBe(false);
      expect(result2.errors).toContain('Missing required field: age');
    });

    it('should validate type constraints', () => {
      const schema = {
        type: 'object',
        properties: {
          count: { type: 'number' },
          enabled: { type: 'boolean' }
        }
      };

      const validInput = { count: 5, enabled: true };
      const result1 = validateInput(validInput, schema);
      expect(result1.valid).toBe(true);

      const invalidInput = { count: 'five', enabled: 'yes' };
      const result2 = validateInput(invalidInput, schema);
      expect(result2.valid).toBe(false);
      expect(result2.errors.length).toBeGreaterThan(0);
    });

    it('should validate string length', () => {
      const schema = {
        type: 'string',
        minLength: 5,
        maxLength: 10
      };

      expect(validateInput('hello', schema).valid).toBe(true);
      expect(validateInput('hi', schema).valid).toBe(false);
      expect(validateInput('this is too long', schema).valid).toBe(false);
    });

    it('should validate number ranges', () => {
      const schema = {
        type: 'number',
        minimum: 0,
        maximum: 100
      };

      expect(validateInput(50, schema).valid).toBe(true);
      expect(validateInput(-5, schema).valid).toBe(false);
      expect(validateInput(150, schema).valid).toBe(false);
    });

    it('should validate arrays', () => {
      const schema = {
        type: 'array',
        items: { type: 'string' }
      };

      expect(validateInput(['a', 'b', 'c'], schema).valid).toBe(true);
      expect(validateInput([1, 2, 3], schema).valid).toBe(false);
    });
  });
});

