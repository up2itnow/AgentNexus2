/**
 * Runtime Configuration Validator
 * Sprint 2: Agent Runtime Hardening
 * 
 * Rejects unsafe agent configurations at registration time.
 * Ensures all agents meet security requirements before execution.
 * 
 * Grant framing:
 * "Agents execute in constrained, auditable environments."
 */

import { z } from 'zod';

/**
 * Resource limits schema with strict bounds
 */
const ResourceLimitsSchema = z.object({
    // CPU: max 100% of one core (100000 quota)
    cpuQuota: z.number()
        .min(1000)
        .max(100000)
        .default(50000),

    // Memory: max 1GB
    memoryMb: z.number()
        .min(32)
        .max(1024)
        .default(512),

    // Timeout: max 10 minutes
    timeoutSeconds: z.number()
        .min(1)
        .max(600)
        .default(300),

    // Process limit: max 100 to prevent fork bombs
    pidsLimit: z.number()
        .min(1)
        .max(100)
        .default(50)
});

/**
 * Security settings schema
 */
const SecuritySettingsSchema = z.object({
    // Network access (default: disabled)
    networkEnabled: z.boolean().default(false),

    // Read-only filesystem (required for production)
    readOnlyRootfs: z.boolean().default(true),

    // Run as non-root (required)
    runAsNonRoot: z.boolean().refine(val => val === true, {
        message: 'Agents must run as non-root user'
    }),

    // Seccomp profile (required)
    seccompProfile: z.enum(['default', 'strict', 'custom']).default('strict'),

    // Privilege escalation (must be false)
    noNewPrivileges: z.boolean().refine(val => val === true, {
        message: 'Agents cannot escalate privileges'
    }),

    // Capabilities (must drop all)
    capabilitiesDrop: z.array(z.string()).refine(
        caps => caps.includes('ALL'),
        { message: 'Must drop ALL capabilities' }
    )
});

/**
 * Complete runtime configuration schema
 */
export const RuntimeConfigSchema = z.object({
    // Docker image (required)
    dockerImage: z.string()
        .min(1)
        .refine(img => !img.includes(':latest'), {
            message: 'Must use specific image tag, not :latest'
        }),

    // Resource limits
    resources: ResourceLimitsSchema,

    // Security settings
    security: SecuritySettingsSchema.default({
        networkEnabled: false,
        readOnlyRootfs: true,
        runAsNonRoot: true,
        seccompProfile: 'strict',
        noNewPrivileges: true,
        capabilitiesDrop: ['ALL']
    })
});

export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    config?: RuntimeConfig;
}

/**
 * Validate a runtime configuration
 * Rejects unsafe configurations with clear error messages
 */
export function validateRuntimeConfig(input: unknown): ValidationResult {
    const result: ValidationResult = {
        valid: false,
        errors: [],
        warnings: []
    };

    try {
        // Parse and validate with Zod
        const config = RuntimeConfigSchema.parse(input);

        // Additional security checks
        const warnings = checkSecurityWarnings(config);

        result.valid = true;
        result.config = config;
        result.warnings = warnings;

    } catch (error) {
        if (error instanceof z.ZodError) {
            result.errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        } else {
            result.errors = ['Unknown validation error'];
        }
    }

    return result;
}

/**
 * Check for security warnings (not errors, but notable)
 */
function checkSecurityWarnings(config: RuntimeConfig): string[] {
    const warnings: string[] = [];

    // Warn if network is enabled
    if (config.security.networkEnabled) {
        warnings.push('Network access enabled - agent can make external requests');
    }

    // Warn if high resource limits
    if (config.resources.memoryMb > 512) {
        warnings.push(`High memory limit: ${config.resources.memoryMb}MB`);
    }

    if (config.resources.timeoutSeconds > 300) {
        warnings.push(`Long timeout: ${config.resources.timeoutSeconds}s`);
    }

    // Warn if not using strict seccomp
    if (config.security.seccompProfile !== 'strict') {
        warnings.push(`Using ${config.security.seccompProfile} seccomp profile`);
    }

    return warnings;
}

/**
 * Get default safe runtime config
 */
export function getDefaultRuntimeConfig(dockerImage: string): RuntimeConfig {
    return {
        dockerImage,
        resources: {
            cpuQuota: 50000,      // 50% CPU
            memoryMb: 512,        // 512MB
            timeoutSeconds: 300,  // 5 minutes
            pidsLimit: 50         // 50 processes
        },
        security: {
            networkEnabled: false,
            readOnlyRootfs: true,
            runAsNonRoot: true,
            seccompProfile: 'strict',
            noNewPrivileges: true,
            capabilitiesDrop: ['ALL']
        }
    };
}
