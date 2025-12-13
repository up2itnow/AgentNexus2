/**
 * Compliance Middleware
 * Sprint 3: Compliance Toggle Layer
 * 
 * Unified compliance enforcement:
 * - Country blocking (extends geofence)
 * - Agent category restrictions
 * - Mock KYC verification
 * - Audit-friendly logging
 * 
 * All toggles are config-driven for easy deployment customization.
 */

import { Request, Response, NextFunction } from 'express';
import { complianceConfig, ComplianceConfig } from '../config/compliance';

export interface ComplianceContext {
    country?: string;
    userId?: string;
    kycVerified?: boolean;
    agentCategory?: string;
    agentId?: string;
}

export interface ComplianceResult {
    allowed: boolean;
    reason?: string;
    code?: string;
}

/**
 * Check country restrictions
 */
function checkCountry(country: string | undefined, config: ComplianceConfig): ComplianceResult {
    if (!config.geofence.enabled || !country) {
        return { allowed: true };
    }

    const normalizedCountry = country.toUpperCase();

    if (config.geofence.blockedCountries.includes(normalizedCountry)) {
        return {
            allowed: false,
            reason: `Access not available in ${normalizedCountry}`,
            code: 'COUNTRY_BLOCKED'
        };
    }

    return { allowed: true };
}

/**
 * Check agent category restrictions
 */
function checkAgentCategory(
    category: string | undefined,
    country: string | undefined,
    config: ComplianceConfig
): ComplianceResult {
    if (!config.agentRestrictions.enabled || !category) {
        return { allowed: true };
    }

    const normalizedCategory = category.toLowerCase();
    const normalizedCountry = country?.toUpperCase();

    // Check if category is globally blocked
    if (config.agentRestrictions.blockedCategories.includes(normalizedCategory)) {
        return {
            allowed: false,
            reason: `Agent category '${normalizedCategory}' is not available`,
            code: 'CATEGORY_BLOCKED'
        };
    }

    // Check country-specific category restrictions
    if (normalizedCountry && config.agentRestrictions.categoryByCountry[normalizedCountry]) {
        const countryBlocked = config.agentRestrictions.categoryByCountry[normalizedCountry];
        if (countryBlocked.includes(normalizedCategory)) {
            return {
                allowed: false,
                reason: `Agent category '${normalizedCategory}' not available in ${normalizedCountry}`,
                code: 'CATEGORY_COUNTRY_BLOCKED'
            };
        }
    }

    return { allowed: true };
}

/**
 * Check KYC requirements
 */
function checkKyc(
    kycVerified: boolean | undefined,
    agentCategory: string | undefined,
    config: ComplianceConfig
): ComplianceResult {
    if (!config.kyc.enabled) {
        return { allowed: true };
    }

    const normalizedCategory = agentCategory?.toLowerCase();

    // Check if category requires KYC
    if (normalizedCategory && config.kyc.requiredForCategories.includes(normalizedCategory)) {
        if (!kycVerified) {
            return {
                allowed: false,
                reason: `KYC verification required for ${normalizedCategory} agents`,
                code: 'KYC_REQUIRED'
            };
        }
    }

    return { allowed: true };
}

/**
 * Log compliance decision for audit
 */
function logComplianceDecision(
    context: ComplianceContext,
    result: ComplianceResult,
    checkType: string
): void {
    const logEntry = {
        timestamp: new Date().toISOString(),
        checkType,
        context: {
            country: context.country,
            userId: context.userId ? `${context.userId.substring(0, 8)}...` : undefined,
            agentCategory: context.agentCategory,
            agentId: context.agentId
        },
        result: {
            allowed: result.allowed,
            code: result.code
        }
    };

    // Audit log (structured for easy parsing)
    console.log(`[COMPLIANCE] ${JSON.stringify(logEntry)}`);
}

/**
 * Main compliance middleware
 */
export function complianceMiddleware(req: Request, res: Response, next: NextFunction) {
    const config = complianceConfig;

    // Extract context from request
    const context: ComplianceContext = {
        country: req.header('X-Geo-Country') || process.env.DEFAULT_GEO_COUNTRY,
        userId: (req as any).userId || req.header('X-User-Id'),
        kycVerified: req.header('X-KYC-Verified') === 'true' || (req as any).kycVerified,
        agentCategory: req.query.category as string || (req as any).agentCategory,
        agentId: req.params.agentId || req.query.agentId as string
    };

    // 1. Check country restrictions
    const countryResult = checkCountry(context.country, config);
    if (!countryResult.allowed) {
        logComplianceDecision(context, countryResult, 'GEOFENCE');
        return res.status(451).json({
            success: false,
            error: {
                code: countryResult.code,
                message: countryResult.reason
            }
        });
    }

    // 2. Check agent category restrictions
    const categoryResult = checkAgentCategory(context.agentCategory, context.country, config);
    if (!categoryResult.allowed) {
        logComplianceDecision(context, categoryResult, 'CATEGORY');
        return res.status(403).json({
            success: false,
            error: {
                code: categoryResult.code,
                message: categoryResult.reason
            }
        });
    }

    // 3. Check KYC requirements
    const kycResult = checkKyc(context.kycVerified, context.agentCategory, config);
    if (!kycResult.allowed) {
        logComplianceDecision(context, kycResult, 'KYC');
        return res.status(403).json({
            success: false,
            error: {
                code: kycResult.code,
                message: kycResult.reason
            }
        });
    }

    // All checks passed
    logComplianceDecision(context, { allowed: true }, 'PASS');

    // Attach context to request for downstream use
    (req as any).complianceContext = context;

    next();
}

/**
 * Compliance check for specific agent execution
 */
export function checkAgentCompliance(
    agentId: string,
    agentCategory: string,
    userId: string,
    country?: string,
    kycVerified?: boolean
): ComplianceResult {
    const config = complianceConfig;

    const context: ComplianceContext = {
        country,
        userId,
        kycVerified,
        agentCategory,
        agentId
    };

    // Run all checks
    const countryResult = checkCountry(country, config);
    if (!countryResult.allowed) {
        logComplianceDecision(context, countryResult, 'GEOFENCE');
        return countryResult;
    }

    const categoryResult = checkAgentCategory(agentCategory, country, config);
    if (!categoryResult.allowed) {
        logComplianceDecision(context, categoryResult, 'CATEGORY');
        return categoryResult;
    }

    const kycResult = checkKyc(kycVerified, agentCategory, config);
    if (!kycResult.allowed) {
        logComplianceDecision(context, kycResult, 'KYC');
        return kycResult;
    }

    return { allowed: true };
}
