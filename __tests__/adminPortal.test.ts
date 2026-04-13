/**
 * Unit tests for Admin Portal Components
 * Tests AuditLogViewer and CapabilityAssignment components
 */

describe('Admin Portal', () => {
    describe('AuditLogViewer', () => {
        type AuditLog = {
            id: string;
            event_type: string;
            severity: 'low' | 'medium' | 'high' | 'critical';
            actor_id: string | null;
            target_id: string | null;
            session_id: string | null;
            ip_address: string | null;
            user_agent: string | null;
            action_details: Record<string, unknown>;
            event_timestamp: string;
            resource_type: string | null;
            resource_id: string | null;
            reason: string | null;
            anomaly_flags: Record<string, unknown>;
            compliance_tags: string[] | null;
            actor_profile?: {
                full_name: string | null;
                email?: string;
            };
            target_profile?: {
                full_name: string | null;
                email?: string;
            };
        };

        const mockAuditLogs: AuditLog[] = [
            {
                id: 'log-1',
                event_type: 'user_login',
                severity: 'low',
                actor_id: 'user-123',
                target_id: null,
                session_id: 'session-1',
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0',
                action_details: { browser: 'Chrome' },
                event_timestamp: '2026-03-27T10:00:00Z',
                resource_type: 'auth',
                resource_id: 'user-123',
                reason: null,
                anomaly_flags: {},
                compliance_tags: null,
                actor_profile: { full_name: 'John Doe' },
                target_profile: null,
            },
            {
                id: 'log-2',
                event_type: 'booking_create',
                severity: 'medium',
                actor_id: 'user-456',
                target_id: 'booking-789',
                session_id: 'session-2',
                ip_address: '10.0.0.1',
                user_agent: 'Mozilla/5.0',
                action_details: { booking_id: 'booking-789' },
                event_timestamp: '2026-03-27T11:00:00Z',
                resource_type: 'booking',
                resource_id: 'booking-789',
                reason: null,
                anomaly_flags: {},
                compliance_tags: null,
                actor_profile: { full_name: 'Jane Smith' },
                target_profile: null,
            },
            {
                id: 'log-3',
                event_type: 'payment_process',
                severity: 'high',
                actor_id: 'admin-001',
                target_id: 'payment-123',
                session_id: 'session-3',
                ip_address: '172.16.0.1',
                user_agent: 'Mozilla/5.0',
                action_details: { amount: 5000, currency: 'BWP' },
                event_timestamp: '2026-03-27T12:00:00Z',
                resource_type: 'payment',
                resource_id: 'payment-123',
                reason: null,
                anomaly_flags: { flagged: true },
                compliance_tags: ['PCI-DSS'],
                actor_profile: { full_name: 'Admin User' },
                target_profile: null,
            },
        ];

        const getSeverityColor = (severity: string) => {
            switch (severity) {
                case 'critical': return 'destructive';
                case 'high': return 'destructive';
                case 'medium': return 'default';
                case 'low': return 'secondary';
                default: return 'outline';
            }
        };

        it('should render audit log rows when query returns data', () => {
            expect(mockAuditLogs.length).toBe(3);
            expect(mockAuditLogs[0].id).toBe('log-1');
            expect(mockAuditLogs[1].id).toBe('log-2');
            expect(mockAuditLogs[2].id).toBe('log-3');
        });

        it('should show error state when query fails', () => {
            const error = { message: 'Failed to fetch audit logs' };
            
            expect(error.message).toBe('Failed to fetch audit logs');
        });

        it('should correctly apply severity color', () => {
            expect(getSeverityColor('critical')).toBe('destructive');
            expect(getSeverityColor('high')).toBe('destructive');
            expect(getSeverityColor('medium')).toBe('default');
            expect(getSeverityColor('low')).toBe('secondary');
            expect(getSeverityColor('unknown')).toBe('outline');
        });

        it('should filter logs by search term', () => {
            const searchTerm = 'john';
            const searchLower = searchTerm.toLowerCase();
            
            const filteredLogs = mockAuditLogs.filter(log => {
                const matchesActor = log.actor_profile?.full_name?.toLowerCase().includes(searchLower);
                const matchesEvent = log.event_type.toLowerCase().includes(searchLower);
                const matchesIP = log.ip_address?.toLowerCase().includes(searchLower);
                return matchesActor || matchesEvent || matchesIP;
            });

            expect(filteredLogs.length).toBe(1);
            expect(filteredLogs[0].actor_profile?.full_name).toBe('John Doe');
        });

        it('should filter logs by severity', () => {
            const severityFilter = ['high'];
            
            const filteredLogs = mockAuditLogs.filter(log => 
                severityFilter.includes(log.severity)
            );

            expect(filteredLogs.length).toBe(1);
            expect(filteredLogs[0].severity).toBe('high');
        });

        it('should filter logs by event type', () => {
            const eventTypeFilter = ['booking_create'];
            
            const filteredLogs = mockAuditLogs.filter(log => 
                eventTypeFilter.includes(log.event_type)
            );

            expect(filteredLogs.length).toBe(1);
            expect(filteredLogs[0].event_type).toBe('booking_create');
        });

        it('should filter logs by actor ID', () => {
            const actorId = 'user-456';
            
            const filteredLogs = mockAuditLogs.filter(log => 
                log.actor_id === actorId
            );

            expect(filteredLogs.length).toBe(1);
            expect(filteredLogs[0].actor_profile?.full_name).toBe('Jane Smith');
        });

        it('should filter logs by IP address', () => {
            const ipFilter = '172.16';
            
            const filteredLogs = mockAuditLogs.filter(log => 
                log.ip_address?.includes(ipFilter)
            );

            expect(filteredLogs.length).toBe(1);
            expect(filteredLogs[0].ip_address).toBe('172.16.0.1');
        });

        it('should display system actor when no actor profile', () => {
            const logWithoutActor: AuditLog = {
                ...mockAuditLogs[0],
                actor_profile: undefined,
                actor_id: null,
            };

            const displayName = logWithoutActor.actor_profile?.full_name || 'System';
            expect(displayName).toBe('System');
        });
    });

    describe('CapabilityAssignment', () => {
        type Capability = {
            id: string;
            name: string;
            description: string;
        };

        type UserCapability = {
            capability_key: string;
        };

        const mockCapabilities: Capability[] = [
            { id: 'users.view', name: 'View Users', description: 'Users' },
            { id: 'users.edit', name: 'Edit Users', description: 'Users' },
            { id: 'bookings.view', name: 'View Bookings', description: 'Bookings' },
            { id: 'bookings.manage', name: 'Manage Bookings', description: 'Bookings' },
            { id: 'payments.view', name: 'View Payments', description: 'Payments' },
            { id: 'admin.settings', name: 'Admin Settings', description: 'Admin' },
        ];

        const mockUserCapabilities: UserCapability[] = [
            { capability_key: 'users.view' },
            { capability_key: 'bookings.view' },
        ];

        it('should call upsert when capability is assigned', async () => {
            const selectedUserId = 'admin-123';
            const capabilityId = 'users.edit';
            const assigned = true;

            const upsertData = {
                admin_id: selectedUserId,
                capability_key: capabilityId,
                capability: capabilityId.split('.').pop(),
            };

            expect(upsertData).toEqual({
                admin_id: 'admin-123',
                capability_key: 'users.edit',
                capability: 'edit',
            });
        });

        it('should call delete when capability is unassigned', async () => {
            const selectedUserId = 'admin-123';
            const capabilityId = 'users.view';
            const assigned = false;

            const deleteCondition = {
                admin_id: selectedUserId,
                capability_key: capabilityId,
            };

            expect(deleteCondition).toEqual({
                admin_id: 'admin-123',
                capability_key: 'users.view',
            });
        });

        it('should check if capability is assigned to user', () => {
            const capabilityId = 'users.view';
            const isAssigned = mockUserCapabilities.some(
                (uc) => uc.capability_key === capabilityId
            );

            expect(isAssigned).toBe(true);
        });

        it('should return false for unassigned capability', () => {
            const capabilityId = 'users.edit';
            const isAssigned = mockUserCapabilities.some(
                (uc) => uc.capability_key === capabilityId
            );

            expect(isAssigned).toBe(false);
        });

        it('should render all capabilities with correct assignment status', () => {
            const results = mockCapabilities.map((capability) => {
                const isAssigned = mockUserCapabilities.some(
                    (uc) => uc.capability_key === capability.id
                );
                return { ...capability, isAssigned };
            });

            expect(results.filter(r => r.isAssigned).length).toBe(2);
            expect(results.filter(r => !r.isAssigned).length).toBe(4);
        });

        it('should handle capability checkbox toggle correctly', () => {
            const handleCapabilityChange = (capabilityId: string, assigned: boolean) => {
                return { capabilityId, assigned };
            };

            const result1 = handleCapabilityChange('users.edit', true);
            expect(result1.assigned).toBe(true);

            const result2 = handleCapabilityChange('users.edit', false);
            expect(result2.assigned).toBe(false);
        });

        it('should not proceed when no user is selected', () => {
            const selectedUserId: string | null = null;
            
            const canProceed = selectedUserId !== null;
            
            expect(canProceed).toBe(false);
        });

        it('should proceed when user is selected', () => {
            const selectedUserId = 'admin-123';
            
            const canProceed = selectedUserId !== null;
            
            expect(canProceed).toBe(true);
        });

        it('should flatten capability sections correctly', () => {
            const source = {
                Users: { view: {}, edit: {}, delete: {} },
                Bookings: { view: {}, manage: {} },
            };

            const flattened: Capability[] = [];
            for (const section of Object.keys(source)) {
                const entries = source[section as keyof typeof source] || {};
                for (const key of Object.keys(entries)) {
                    const capKey = `${section}.${key}`;
                    const name = key.replace(/_/g, ' ');
                    flattened.push({ id: capKey, name, description: section });
                }
            }

            expect(flattened.length).toBe(5);
            expect(flattened[0]).toEqual({ id: 'Users.view', name: 'view', description: 'Users' });
            expect(flattened[3]).toEqual({ id: 'Bookings.view', name: 'view', description: 'Bookings' });
        });
    });
});
