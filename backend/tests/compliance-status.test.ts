/**
 * Compliance Status Tests
 * 
 * Tests for the compliance configuration and status endpoint.
 * Verifies all toggles default to false (compliance-capable, not enforcing).
 */

import request from 'supertest';
import express from 'express';
import {
    loadComplianceConfig,
    getComplianceStatus,
    refreshComplianceConfig
} from '../src/config/compliance';
import { AuditLoggerService } from '../src/services/AuditLoggerService';

describe('Compliance Configuration', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...OLD_ENV };
        // Clear all compliance environment variables
        delete process.env.COMPLIANCE_GEOFENCE_ENABLED;
        delete process.env.COMPLIANCE_KYC_ENABLED;
        delete process.env.COMPLIANCE_AGENT_RESTRICTIONS_ENABLED;
        delete process.env.COMPLIANCE_AUDIT_LOGGING_ENABLED;
        delete process.env.COMPLIANCE_RUNTIME_ISOLATION_ENABLED;
    });

    afterAll(() => {
        process.env = OLD_ENV;
    });

    describe('loadComplianceConfig', () => {
        it('should default all toggles to false', () => {
            const config = loadComplianceConfig();

            expect(config.geofence.enabled).toBe(false);
            expect(config.kyc.enabled).toBe(false);
            expect(config.agentRestrictions.enabled).toBe(false);
            expect(config.auditLogging.enabled).toBe(false);
            expect(config.runtimeIsolation.enabled).toBe(false);
        });

        it('should have default blocked countries list', () => {
            const config = loadComplianceConfig();

            expect(config.geofence.blockedCountries).toContain('KP');
            expect(config.geofence.blockedCountries).toContain('IR');
            expect(config.geofence.blockedCountries).toContain('CU');
            expect(config.geofence.blockedCountries).toContain('SY');
            expect(config.geofence.blockedCountries).toContain('RU');
        });

        it('should have default KYC required categories', () => {
            const config = loadComplianceConfig();

            expect(config.kyc.requiredForCategories).toContain('trading');
            expect(config.kyc.requiredForCategories).toContain('financial');
            expect(config.kyc.requiredForCategories).toContain('high-risk');
        });

        it('should have default runtime isolation settings', () => {
            const config = loadComplianceConfig();

            expect(config.runtimeIsolation.networkMode).toBe('none');
            expect(config.runtimeIsolation.readOnlyRootfs).toBe(true);
            expect(config.runtimeIsolation.dropAllCapabilities).toBe(true);
            expect(config.runtimeIsolation.seccompProfile).toBe(true);
            expect(config.runtimeIsolation.maxMemoryMB).toBe(512);
            expect(config.runtimeIsolation.maxCpuPercent).toBe(50);
            expect(config.runtimeIsolation.timeoutSeconds).toBe(300);
        });

        it('should have default audit logging settings', () => {
            const config = loadComplianceConfig();

            expect(config.auditLogging.retentionDays).toBe(90);
            expect(config.auditLogging.logLevel).toBe('standard');
        });

        it('should enable toggles when env vars set to true', () => {
            process.env.COMPLIANCE_GEOFENCE_ENABLED = 'true';
            process.env.COMPLIANCE_KYC_ENABLED = 'true';
            process.env.COMPLIANCE_AGENT_RESTRICTIONS_ENABLED = 'true';
            process.env.COMPLIANCE_AUDIT_LOGGING_ENABLED = 'true';
            process.env.COMPLIANCE_RUNTIME_ISOLATION_ENABLED = 'true';

            const config = loadComplianceConfig();

            expect(config.geofence.enabled).toBe(true);
            expect(config.kyc.enabled).toBe(true);
            expect(config.agentRestrictions.enabled).toBe(true);
            expect(config.auditLogging.enabled).toBe(true);
            expect(config.runtimeIsolation.enabled).toBe(true);
        });
    });

    describe('getComplianceStatus', () => {
        it('should return status with all toggles false by default', () => {
            refreshComplianceConfig();
            const status = getComplianceStatus();

            expect(status.features.geofence.enabled).toBe(false);
            expect(status.features.kyc.enabled).toBe(false);
            expect(status.features.agentRestrictions.enabled).toBe(false);
            expect(status.features.auditLogging.enabled).toBe(false);
            expect(status.features.runtimeIsolation.enabled).toBe(false);
            expect(status.allEnabled).toBe(false);
        });

        it('should include timestamp', () => {
            refreshComplianceConfig();
            const status = getComplianceStatus();

            expect(status.timestamp).toBeDefined();
            expect(new Date(status.timestamp)).toBeInstanceOf(Date);
        });

        it('should include feature details', () => {
            refreshComplianceConfig();
            const status = getComplianceStatus();

            expect(status.features.geofence.blockedCountries).toBeGreaterThan(0);
            expect(status.features.kyc.requiredCategories).toBeGreaterThan(0);
            expect(status.features.auditLogging.retentionDays).toBe(90);
            expect(status.features.runtimeIsolation.networkMode).toBe('none');
        });
    });
});

describe('AuditLoggerService', () => {
    let auditLogger: AuditLoggerService;

    beforeEach(() => {
        auditLogger = new AuditLoggerService();
    });

    afterEach(() => {
        auditLogger.clear();
    });

    describe('log', () => {
        it('should create audit event with id and timestamp', () => {
            const event = auditLogger.log({
                type: 'COMPLIANCE_CHECK',
                severity: 'info',
                action: 'test_action',
                outcome: 'allowed'
            });

            expect(event.id).toBeDefined();
            expect(event.id).toMatch(/^audit_/);
            expect(event.timestamp).toBeDefined();
        });

        it('should log compliance check events', () => {
            const event = auditLogger.logComplianceCheck({
                userId: 'user123',
                agentId: 'agent456',
                country: 'US',
                checkType: 'geofence',
                outcome: 'allowed'
            });

            expect(event.type).toBe('COMPLIANCE_CHECK');
            expect(event.userId).toBe('user123');
            expect(event.agentId).toBe('agent456');
            expect(event.outcome).toBe('allowed');
        });

        it('should log execution events', () => {
            const event = auditLogger.logExecution({
                executionId: 'exec123',
                userId: 'user123',
                agentId: 'agent456',
                status: 'start'
            });

            expect(event.type).toBe('EXECUTION_START');
            expect(event.executionId).toBe('exec123');
        });

        it('should log security alerts', () => {
            const event = auditLogger.logSecurityAlert({
                userId: 'user123',
                alertType: 'injection_attempt',
                description: 'Potential SQL injection detected',
                severity: 'critical'
            });

            expect(event.type).toBe('SECURITY_ALERT');
            expect(event.severity).toBe('critical');
            expect(event.outcome).toBe('blocked');
        });
    });

    describe('query', () => {
        it('should return empty array when audit logging disabled', () => {
            // Logging is disabled by default
            auditLogger.log({
                type: 'COMPLIANCE_CHECK',
                severity: 'info',
                action: 'test',
                outcome: 'allowed'
            });

            const results = auditLogger.query({});
            expect(results).toEqual([]);
        });
    });

    describe('getRetentionPolicy', () => {
        it('should return current retention policy', () => {
            const policy = auditLogger.getRetentionPolicy();

            expect(policy.enabled).toBe(false);
            expect(policy.retentionDays).toBe(90);
            expect(policy.logLevel).toBe('standard');
            expect(policy.estimatedEventCount).toBeDefined();
        });
    });
});

describe('Compliance Status Endpoint', () => {
    let app: express.Application;

    beforeAll(() => {
        app = express();
        app.get('/api/compliance/status', (_req, res) => {
            const status = getComplianceStatus();
            res.json({
                success: true,
                message: 'Compliance-capable infrastructure.',
                ...status
            });
        });
    });

    it('should return compliance status', async () => {
        const res = await request(app).get('/api/compliance/status');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.features).toBeDefined();
    });

    it('should show all toggles as false by default', async () => {
        const res = await request(app).get('/api/compliance/status');

        expect(res.body.features.geofence.enabled).toBe(false);
        expect(res.body.features.kyc.enabled).toBe(false);
        expect(res.body.features.agentRestrictions.enabled).toBe(false);
        expect(res.body.features.auditLogging.enabled).toBe(false);
        expect(res.body.features.runtimeIsolation.enabled).toBe(false);
        expect(res.body.allEnabled).toBe(false);
    });

    it('should include runtime isolation details', async () => {
        const res = await request(app).get('/api/compliance/status');

        expect(res.body.features.runtimeIsolation.networkMode).toBe('none');
        expect(res.body.features.runtimeIsolation.seccompProfile).toBe(true);
    });
});
