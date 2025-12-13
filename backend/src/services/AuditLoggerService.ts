/**
 * AuditLoggerService
 * Sprint 3: Compliance-Friendly Audit Logging
 * 
 * Structured logging service for compliance events.
 * Logs are formatted for easy parsing and retention.
 * 
 * Toggle: COMPLIANCE_AUDIT_LOGGING_ENABLED
 * When disabled, logs are still generated but not persisted.
 */

import { complianceConfig } from '../config/compliance';

/**
 * Audit event types for compliance tracking
 */
export type AuditEventType =
    | 'COMPLIANCE_CHECK'
    | 'GEOFENCE_BLOCK'
    | 'GEOFENCE_ALLOW'
    | 'KYC_REQUIRED'
    | 'KYC_VERIFIED'
    | 'CATEGORY_BLOCKED'
    | 'CATEGORY_ALLOWED'
    | 'EXECUTION_START'
    | 'EXECUTION_END'
    | 'EXECUTION_FAILED'
    | 'AGENT_ACCESS'
    | 'USER_ACTION'
    | 'SECURITY_ALERT';

/**
 * Structured audit event
 */
export interface AuditEvent {
    id: string;
    timestamp: string;
    type: AuditEventType;
    severity: 'info' | 'warn' | 'error' | 'critical';
    userId?: string;
    agentId?: string;
    executionId?: string;
    country?: string;
    category?: string;
    action: string;
    outcome: 'allowed' | 'blocked' | 'error' | 'pending';
    details?: Record<string, unknown>;
    metadata?: {
        ip?: string;
        userAgent?: string;
        requestId?: string;
    };
}

/**
 * Filter for querying audit logs
 */
export interface AuditFilter {
    startDate?: Date;
    endDate?: Date;
    type?: AuditEventType[];
    userId?: string;
    agentId?: string;
    outcome?: 'allowed' | 'blocked' | 'error';
    severity?: 'info' | 'warn' | 'error' | 'critical';
    limit?: number;
}

/**
 * Retention policy information
 */
export interface RetentionPolicy {
    enabled: boolean;
    retentionDays: number;
    logLevel: 'minimal' | 'standard' | 'verbose';
    estimatedEventCount: number;
}

/**
 * AuditLoggerService
 * 
 * Provides structured audit logging for compliance events.
 * All events are logged to console in JSON format for easy ingestion
 * by log aggregation systems (ELK, Splunk, CloudWatch, etc.)
 */
export class AuditLoggerService {
    private events: AuditEvent[] = [];
    private eventCounter = 0;

    /**
     * Log an audit event
     */
    log(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
        const config = complianceConfig.auditLogging;

        const fullEvent: AuditEvent = {
            id: this.generateEventId(),
            timestamp: new Date().toISOString(),
            ...event
        };

        // Always log to console (structured JSON for log aggregation)
        const logPrefix = '[AUDIT]';
        const logEntry = this.formatLogEntry(fullEvent, config.logLevel);

        switch (fullEvent.severity) {
            case 'critical':
            case 'error':
                console.error(`${logPrefix} ${logEntry}`);
                break;
            case 'warn':
                console.warn(`${logPrefix} ${logEntry}`);
                break;
            default:
                console.log(`${logPrefix} ${logEntry}`);
        }

        // Store in memory if enabled (for query support)
        if (config.enabled) {
            this.events.push(fullEvent);

            // Simple memory management - keep last 10000 events
            if (this.events.length > 10000) {
                this.events = this.events.slice(-10000);
            }
        }

        return fullEvent;
    }

    /**
     * Log a compliance check event
     */
    logComplianceCheck(params: {
        userId?: string;
        agentId?: string;
        country?: string;
        category?: string;
        checkType: 'geofence' | 'kyc' | 'category' | 'all';
        outcome: 'allowed' | 'blocked';
        reason?: string;
    }): AuditEvent {
        return this.log({
            type: 'COMPLIANCE_CHECK',
            severity: params.outcome === 'blocked' ? 'warn' : 'info',
            userId: params.userId,
            agentId: params.agentId,
            country: params.country,
            category: params.category,
            action: `compliance_${params.checkType}_check`,
            outcome: params.outcome,
            details: {
                checkType: params.checkType,
                reason: params.reason
            }
        });
    }

    /**
     * Log an execution event
     */
    logExecution(params: {
        executionId: string;
        userId: string;
        agentId: string;
        status: 'start' | 'end' | 'failed';
        duration?: number;
        error?: string;
    }): AuditEvent {
        const typeMap: Record<string, AuditEventType> = {
            start: 'EXECUTION_START',
            end: 'EXECUTION_END',
            failed: 'EXECUTION_FAILED'
        };

        return this.log({
            type: typeMap[params.status],
            severity: params.status === 'failed' ? 'error' : 'info',
            userId: params.userId,
            agentId: params.agentId,
            executionId: params.executionId,
            action: `execution_${params.status}`,
            outcome: params.status === 'failed' ? 'error' : 'allowed',
            details: {
                duration: params.duration,
                error: params.error
            }
        });
    }

    /**
     * Log a security alert
     */
    logSecurityAlert(params: {
        userId?: string;
        agentId?: string;
        alertType: string;
        description: string;
        severity: 'warn' | 'error' | 'critical';
    }): AuditEvent {
        return this.log({
            type: 'SECURITY_ALERT',
            severity: params.severity,
            userId: params.userId,
            agentId: params.agentId,
            action: `security_alert_${params.alertType}`,
            outcome: 'blocked',
            details: {
                alertType: params.alertType,
                description: params.description
            }
        });
    }

    /**
     * Query audit events (only when enabled)
     */
    query(filter: AuditFilter): AuditEvent[] {
        const config = complianceConfig.auditLogging;

        if (!config.enabled) {
            return [];
        }

        let results = [...this.events];

        if (filter.startDate) {
            results = results.filter(e => new Date(e.timestamp) >= filter.startDate!);
        }
        if (filter.endDate) {
            results = results.filter(e => new Date(e.timestamp) <= filter.endDate!);
        }
        if (filter.type?.length) {
            results = results.filter(e => filter.type!.includes(e.type));
        }
        if (filter.userId) {
            results = results.filter(e => e.userId === filter.userId);
        }
        if (filter.agentId) {
            results = results.filter(e => e.agentId === filter.agentId);
        }
        if (filter.outcome) {
            results = results.filter(e => e.outcome === filter.outcome);
        }
        if (filter.severity) {
            results = results.filter(e => e.severity === filter.severity);
        }

        const limit = filter.limit || 100;
        return results.slice(-limit);
    }

    /**
     * Get current retention policy
     */
    getRetentionPolicy(): RetentionPolicy {
        const config = complianceConfig.auditLogging;
        return {
            enabled: config.enabled,
            retentionDays: config.retentionDays,
            logLevel: config.logLevel,
            estimatedEventCount: this.events.length
        };
    }

    /**
     * Clear all events (for testing)
     */
    clear(): void {
        this.events = [];
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        this.eventCounter++;
        const timestamp = Date.now().toString(36);
        const counter = this.eventCounter.toString(36).padStart(4, '0');
        const random = Math.random().toString(36).substring(2, 6);
        return `audit_${timestamp}_${counter}_${random}`;
    }

    /**
     * Format log entry based on log level
     */
    private formatLogEntry(event: AuditEvent, level: 'minimal' | 'standard' | 'verbose'): string {
        switch (level) {
            case 'minimal':
                return JSON.stringify({
                    id: event.id,
                    type: event.type,
                    outcome: event.outcome,
                    timestamp: event.timestamp
                });
            case 'verbose':
                return JSON.stringify(event);
            case 'standard':
            default:
                return JSON.stringify({
                    id: event.id,
                    type: event.type,
                    severity: event.severity,
                    action: event.action,
                    outcome: event.outcome,
                    userId: event.userId,
                    agentId: event.agentId,
                    timestamp: event.timestamp
                });
        }
    }
}

/**
 * Singleton instance for global access
 */
export const auditLogger = new AuditLoggerService();
