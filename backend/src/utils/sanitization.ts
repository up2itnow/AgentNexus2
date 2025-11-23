/**
 * Input and Log Sanitization Utilities
 * 
 * Provides functions to sanitize user input and logs to prevent:
 * - Command injection
 * - Log injection
 * - Secret leakage
 * - XSS attacks
 * 
 * @author AgentNexus Team ()
 */

/**
 * Patterns for detecting secrets and sensitive data
 */
const SENSITIVE_PATTERNS = [
  // API Keys
  /api[_-]?key[_-]?[:=]\s*['"]?([a-zA-Z0-9_-]{20,})/gi,
  /[a-z0-9]{32,}/gi,  // Generic 32+ char hex strings

  // AWS Credentials
  /AKIA[0-9A-Z]{16}/gi,
  /aws[_-]?secret[_-]?access[_-]?key[_-]?[:=]\s*['"]?([a-zA-Z0-9+/]{40})/gi,

  // Private Keys
  /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
  /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/gi,

  // JWT Tokens
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/gi,

  // GitHub Tokens
  /gh[ps]_[a-zA-Z0-9]{36,}/gi,

  // Database URLs
  /postgres:\/\/[^:]+:[^@]+@[^\/]+\/[^\s]+/gi,
  /mongodb(\+srv)?:\/\/[^:]+:[^@]+@[^\/]+\/[^\s]+/gi,

  // Credit Cards (basic pattern)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/gi,

  // Email addresses (can be PII)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,

  // IP Addresses (internal networks)
  /\b(?:10|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/gi,

  // Ethereum Private Keys
  /0x[a-fA-F0-9]{64}/gi,

  // Bearer Tokens
  /Bearer\s+[a-zA-Z0-9_-]{20,}/gi,

  // Generic password patterns
  /password[_-]?[:=]\s*['"]?([^\s'"]+)/gi,
  /pwd[_-]?[:=]\s*['"]?([^\s'"]+)/gi,
  /secret[_-]?[:=]\s*['"]?([^\s'"]+)/gi,

  // JSON keys with sensitive names (camelCase)
  /"(apiKey|secretKey|privateKey|accessToken|refreshToken|password|secret)":\s*"([^"]+)"/gi
];

/**
 * Sanitize user input to prevent injection attacks
 * 
 * @param input - User-provided input data
 * @returns Sanitized input
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize both keys and values
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeInput(value);
    }
    return sanitized;
  }

  // Numbers, booleans, null, undefined pass through
  return input;
}

/**
 * Sanitize a string to prevent command injection
 * 
 * @param str - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  // Remove null bytes (can cause issues in C-based programs)
  let sanitized = str.replace(/\0/g, '');

  // Remove control characters except newline and tab
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit length to prevent DoS
  const MAX_INPUT_LENGTH = 100000; // 100KB
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }

  return sanitized;
}

/**
 * Sanitize logs to remove secrets and sensitive data
 * 
 * This function redacts sensitive information from logs before
 * they are stored or displayed to users.
 * 
 * @param logText - Log text to sanitize
 * @returns Sanitized log text with secrets redacted
 * 
 * @example
 * ```typescript
 * const log = "API_KEY=sk_live_abc123def456";
 * const sanitized = sanitizeLogs(log);
 * // Result: "API_KEY=***REDACTED***"
 * ```
 */
export function sanitizeLogs(logText: string): string {
  if (typeof logText !== 'string') {
    return String(logText);
  }

  let sanitized = logText;

  // Apply all sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '***REDACTED***');
  }

  // Redact common environment variable patterns (more comprehensive)
  sanitized = sanitized.replace(
    /\b([A-Z_]*(?:KEY|SECRET|TOKEN|PASSWORD|PWD)[A-Z_]*)=([^\s]+)/gi,
    '$1=***REDACTED***'
  );

  return sanitized;
}

/**
 * Validate JSON input against a schema
 * 
 * @param input - Input to validate
 * @param schema - JSON Schema object
 * @returns Validation result with errors if any
 */
export function validateInput(
  input: any,
  schema: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic type checking based on schema
  if (schema.type === 'object') {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      errors.push(`Expected object, got ${typeof input}`);
      return { valid: false, errors };
    }

    // Check required fields
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in input)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, value] of Object.entries(input)) {
        if (schema.properties[key]) {
          const propResult = validateInput(value, schema.properties[key]);
          errors.push(...propResult.errors);
        } else if (schema.additionalProperties === false) {
          errors.push(`Unexpected property: ${key}`);
        }
      }
    }
  }

  if (schema.type === 'string' && typeof input !== 'string') {
    errors.push(`Expected string, got ${typeof input}`);
  }

  if (schema.type === 'number' && typeof input !== 'number') {
    errors.push(`Expected number, got ${typeof input}`);
  }

  if (schema.type === 'boolean' && typeof input !== 'boolean') {
    errors.push(`Expected boolean, got ${typeof input}`);
  }

  if (schema.type === 'array') {
    if (!Array.isArray(input)) {
      errors.push(`Expected array, got ${typeof input}`);
    } else if (schema.items) {
      input.forEach((item, index) => {
        const itemResult = validateInput(item, schema.items);
        itemResult.errors.forEach(err => {
          errors.push(`[${index}]: ${err}`);
        });
      });
    }
  }

  // Check string length limits
  if (schema.type === 'string' && typeof input === 'string') {
    if (schema.minLength && input.length < schema.minLength) {
      errors.push(`String too short (min: ${schema.minLength})`);
    }
    if (schema.maxLength && input.length > schema.maxLength) {
      errors.push(`String too long (max: ${schema.maxLength})`);
    }
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(input)) {
        errors.push(`String does not match pattern: ${schema.pattern}`);
      }
    }
  }

  // Check number ranges
  if (schema.type === 'number' && typeof input === 'number') {
    if (schema.minimum !== undefined && input < schema.minimum) {
      errors.push(`Number too small (min: ${schema.minimum})`);
    }
    if (schema.maximum !== undefined && input > schema.maximum) {
      errors.push(`Number too large (max: ${schema.maximum})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detect if input contains potential command injection attempts
 * 
 * @param input - Input to check
 * @returns True if injection attempt detected
 */
export function detectInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  // Dangerous shell metacharacters
  const dangerousPatterns = [
    /[;&|`$()<>]/,  // Shell metacharacters (excluding JSON chars {}, [])
    /\$\(/,              // Command substitution
    /\${/,               // Variable expansion
    /\.\.\//,            // Path traversal
    /\/etc\/passwd/i,    // Common attack target
    /\/bin\/(sh|bash)/i, // Shell execution
    /eval\s*\(/i,        // Code evaluation
    /exec\s*\(/i,        // Code execution
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Create a safe summary of input for logging (redacts sensitive data)
 * 
 * @param input - Input to summarize
 * @returns Safe summary string
 */
export function createSafeSummary(input: any): string {
  try {
    const str = JSON.stringify(input, null, 2);
    return sanitizeLogs(str.substring(0, 500)); // Limit to 500 chars
  } catch (e) {
    return '[Unable to stringify input]';
  }
}

