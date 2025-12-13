/**
 * Compliance Configuration
 * Sprint 3: Config-driven compliance toggles
 * 
 * All compliance settings are loaded from environment variables
 * with sensible defaults for development.
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
 */
export function loadComplianceConfig(): ComplianceConfig {
    return {
        geofence: {
            // Enable geofencing (default: false for dev, true for prod)
            enabled: process.env.COMPLIANCE_GEOFENCE_ENABLED === 'true',

            // Blocked countries (ISO 3166-1 alpha-2 codes)
            // Default: OFAC sanctioned countries
            blockedCountries: parseList(
                process.env.COMPLIANCE_BLOCKED_COUNTRIES ||
                'KP,IR,CU,SY,RU'
            )
        },

        agentRestrictions: {
            // Enable category restrictions (default: false for dev)
            enabled: process.env.COMPLIANCE_AGENT_RESTRICTIONS_ENABLED === 'true',

            // Globally blocked categories
            blockedCategories: parseList(
                process.env.COMPLIANCE_BLOCKED_CATEGORIES || ''
            ),

            // Country-specific category restrictions
            // Example: US blocks trading agents with certain risk levels
            categoryByCountry: parseCategoryByCountry(
                process.env.COMPLIANCE_CATEGORY_BY_COUNTRY || ''
            )
        },

        kyc: {
            // Enable KYC requirements (default: false for dev)
            enabled: process.env.COMPLIANCE_KYC_ENABLED === 'true',

            // Categories that require KYC verification
            requiredForCategories: parseList(
                process.env.COMPLIANCE_KYC_REQUIRED_CATEGORIES ||
                'trading,financial,high-risk'
            )
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
