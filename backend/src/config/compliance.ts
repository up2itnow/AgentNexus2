/**
 * Compliance Configuration
 * Sprint 3: Config-driven compliance toggles
 * 
 * All compliance settings are loaded from environment variables
 * with sensible defaults for development.
 * 
 * COMPLIANCE-CAPABLE: All toggles default to FALSE.
 * Set to TRUE via environment variables to enable enforcement.
 */

export interface ComplianceConfig {
    geofence: {
        enabled: boolean;
        blockedCountries: string[];
    };
    agentRestrictions: {
        enabled: boolean;
        blockedCategories: string[];
        categoryByCountry: Record<string, string[]>;
    };
    kyc: {
        enabled: boolean;
        requiredForCategories: string[];
    };
    auditLogging: {
        enabled: boolean;
        retentionDays: number;
        logLevel: 'minimal' | 'standard' | 'verbose';
    };
    runtimeIsolation: {
        enabled: boolean;
        networkMode: 'none' | 'bridge';
        readOnlyRootfs: boolean;
        dropAllCapabilities: boolean;
        seccompProfile: boolean;
        maxMemoryMB: number;
        maxCpuPercent: number;
        timeoutSeconds: number;
    };
}

/**
 * Parse comma-separated environment variable
 */
function parseList(envVar: string | undefined): string[] {
    if (!envVar) return [];
    return envVar.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse country-specific category restrictions
 * Format: "US:trading,gambling;UK:gambling"
 */
function parseCategoryByCountry(envVar: string | undefined): Record<string, string[]> {
    if (!envVar) return {};

    const result: Record<string, string[]> = {};
    const pairs = envVar.split(';');

    for (const pair of pairs) {
        const [country, categories] = pair.split(':');
        if (country && categories) {
            result[country.trim().toUpperCase()] = categories.split(',').map(s => s.trim().toLowerCase());
        }
    }

    return result;
}

/**
 * Load compliance configuration from environment
 * ALL TOGGLES DEFAULT TO FALSE (compliance-capable, not enforcing)
 */
export function loadComplianceConfig(): ComplianceConfig {
    return {
        geofence: {
            // Enable geofencing (default: false)
            enabled: process.env.COMPLIANCE_GEOFENCE_ENABLED === 'true',

            // Blocked countries (ISO 3166-1 alpha-2 codes)
            // Default: OFAC sanctioned countries
            blockedCountries: parseList(
                process.env.COMPLIANCE_BLOCKED_COUNTRIES ||
                'KP,IR,CU,SY,RU'
            )
        },

        agentRestrictions: {
            // Enable category restrictions (default: false)
            enabled: process.env.COMPLIANCE_AGENT_RESTRICTIONS_ENABLED === 'true',

            // Globally blocked categories
            blockedCategories: parseList(
                process.env.COMPLIANCE_BLOCKED_CATEGORIES || ''
            ),

            // Country-specific category restrictions
            categoryByCountry: parseCategoryByCountry(
                process.env.COMPLIANCE_CATEGORY_BY_COUNTRY || ''
            )
        },

        kyc: {
            // Enable KYC requirements (default: false)
            enabled: process.env.COMPLIANCE_KYC_ENABLED === 'true',

            // Categories that require KYC verification
            requiredForCategories: parseList(
                process.env.COMPLIANCE_KYC_REQUIRED_CATEGORIES ||
                'trading,financial,high-risk'
            )
        },

        auditLogging: {
            // Enable audit logging (default: false)
            enabled: process.env.COMPLIANCE_AUDIT_LOGGING_ENABLED === 'true',

            // Log retention period in days
            retentionDays: parseInt(process.env.COMPLIANCE_AUDIT_RETENTION_DAYS || '90', 10),

            // Log detail level
            logLevel: (process.env.COMPLIANCE_AUDIT_LOG_LEVEL as 'minimal' | 'standard' | 'verbose') || 'standard'
        },

        runtimeIsolation: {
            // Enable runtime isolation (default: false)
            // When false, Docker containers run with relaxed settings for development
            enabled: process.env.COMPLIANCE_RUNTIME_ISOLATION_ENABLED === 'true',

            // Network mode: 'none' for full isolation, 'bridge' for development
            networkMode: (process.env.COMPLIANCE_RUNTIME_NETWORK_MODE as 'none' | 'bridge') || 'none',

            // Read-only root filesystem
            readOnlyRootfs: process.env.COMPLIANCE_RUNTIME_READONLY_ROOTFS !== 'false',

            // Drop all Linux capabilities
            dropAllCapabilities: process.env.COMPLIANCE_RUNTIME_DROP_CAPS !== 'false',

            // Use seccomp profile for syscall filtering
            seccompProfile: process.env.COMPLIANCE_RUNTIME_SECCOMP !== 'false',

            // Resource limits
            maxMemoryMB: parseInt(process.env.COMPLIANCE_RUNTIME_MAX_MEMORY_MB || '512', 10),
            maxCpuPercent: parseInt(process.env.COMPLIANCE_RUNTIME_MAX_CPU_PERCENT || '50', 10),
            timeoutSeconds: parseInt(process.env.COMPLIANCE_RUNTIME_TIMEOUT_SECONDS || '300', 10)
        }
    };
}

/**
 * Cached compliance configuration
 * Reloads on process restart or when explicitly refreshed
 */
export let complianceConfig = loadComplianceConfig();

/**
 * Refresh compliance configuration from environment
 * Call this after updating env vars at runtime
 */
export function refreshComplianceConfig(): ComplianceConfig {
    complianceConfig = loadComplianceConfig();
    console.log('[COMPLIANCE] Configuration refreshed');
    return complianceConfig;
}

/**
 * Get current compliance status for all features
 * Used by the /api/compliance/status endpoint
 */
export function getComplianceStatus(): {
    timestamp: string;
    features: {
        geofence: { enabled: boolean; blockedCountries: number };
        kyc: { enabled: boolean; requiredCategories: number };
        agentRestrictions: { enabled: boolean; blockedCategories: number };
        auditLogging: { enabled: boolean; retentionDays: number; logLevel: string };
        runtimeIsolation: { enabled: boolean; networkMode: string; seccompProfile: boolean };
    };
    allEnabled: boolean;
} {
    const config = complianceConfig;
    return {
        timestamp: new Date().toISOString(),
        features: {
            geofence: {
                enabled: config.geofence.enabled,
                blockedCountries: config.geofence.blockedCountries.length
            },
            kyc: {
                enabled: config.kyc.enabled,
                requiredCategories: config.kyc.requiredForCategories.length
            },
            agentRestrictions: {
                enabled: config.agentRestrictions.enabled,
                blockedCategories: config.agentRestrictions.blockedCategories.length
            },
            auditLogging: {
                enabled: config.auditLogging.enabled,
                retentionDays: config.auditLogging.retentionDays,
                logLevel: config.auditLogging.logLevel
            },
            runtimeIsolation: {
                enabled: config.runtimeIsolation.enabled,
                networkMode: config.runtimeIsolation.networkMode,
                seccompProfile: config.runtimeIsolation.seccompProfile
            }
        },
        allEnabled: config.geofence.enabled &&
            config.kyc.enabled &&
            config.agentRestrictions.enabled &&
            config.auditLogging.enabled &&
            config.runtimeIsolation.enabled
    };
}
