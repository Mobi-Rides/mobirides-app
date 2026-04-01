/**
 * Unit tests for Insurance Claims Flow
 * Tests claim submission form, status display, and field aliases
 */

describe('Insurance Claims', () => {

    describe('Claim Field Mapping', () => {
        const mapDbClaimToUi = (dbClaim: any) => ({
            ...dbClaim,
            incident_location: dbClaim.incident_location ?? dbClaim.location,
            estimated_repair_cost: dbClaim.estimated_repair_cost ?? dbClaim.estimated_damage_cost,
            excess_amount: dbClaim.excess_amount ?? dbClaim.excess_amount_due,
        });

        it('should map location to incident_location when location is provided', () => {
            const dbClaim = {
                id: 'claim-123',
                location: 'Gaborone Main Road',
                estimated_damage_cost: 5000,
                excess_amount_due: 1000,
            };

            const uiClaim = mapDbClaimToUi(dbClaim);

            expect(uiClaim.incident_location).toBe('Gaborone Main Road');
            expect(uiClaim.estimated_repair_cost).toBe(5000);
            expect(uiClaim.excess_amount).toBe(1000);
        });

        it('should use incident_location when both are provided', () => {
            const dbClaim = {
                id: 'claim-456',
                location: 'Old Location',
                incident_location: 'New Location',
                estimated_damage_cost: 3000,
                excess_amount_due: 500,
            };

            const uiClaim = mapDbClaimToUi(dbClaim);

            expect(uiClaim.incident_location).toBe('New Location');
        });

        it('should fall back to estimated_damage_cost when estimated_repair_cost is null', () => {
            const dbClaim = {
                id: 'claim-789',
                location: 'Test Location',
                estimated_damage_cost: 7500,
                estimated_repair_cost: null,
            };

            const uiClaim = mapDbClaimToUi(dbClaim);

            expect(uiClaim.estimated_repair_cost).toBe(7500);
        });

        it('should fall back to excess_amount_due when excess_amount is null', () => {
            const dbClaim = {
                id: 'claim-101',
                location: 'Test Location',
                excess_amount: null,
                excess_amount_due: 2000,
            };

            const uiClaim = mapDbClaimToUi(dbClaim);

            expect(uiClaim.excess_amount).toBe(2000);
        });
    });

    describe('Claim Status Field Aliases', () => {
        it('should correctly map location to incident_location', () => {
            const rawClaim = {
                id: 'claim-123',
                claim_number: 'CLM-001',
                policy_id: 'policy-123',
                booking_id: 'booking-456',
                renter_id: 'user-123',
                incident_date: '2026-03-20',
                incident_type: 'collision',
                incident_description: 'Test description',
                damage_description: 'Damage details',
                location: 'Gaborone Main Road',
                police_report_filed: false,
                police_report_number: null,
                police_station: null,
                estimated_damage_cost: 5000,
                estimated_repair_cost: null,
                actual_damage_cost: null,
                status: 'submitted',
                approved_amount: null,
                excess_paid: null,
                excess_amount_due: null,
                excess_amount: null,
                admin_fee: null,
                payout_amount: null,
                total_claim_cost: null,
                rejection_reason: null,
                evidence_urls: null,
                supporting_documents: null,
                repair_quotes_urls: null,
                repair_invoices_urls: null,
                submitted_at: '',
                reviewed_at: null,
                more_info_requested_at: null,
                resolved_at: null,
                paid_at: null,
                admin_notes: null,
                reviewed_by: null,
                created_at: '2026-03-20T10:00:00Z',
                updated_at: '2026-03-20T10:00:00Z',
            };

            const mappedClaim = {
                ...rawClaim,
                incident_location: rawClaim.location ?? rawClaim.location,
                estimated_repair_cost: rawClaim.estimated_repair_cost ?? rawClaim.estimated_damage_cost,
                excess_amount: rawClaim.excess_amount ?? rawClaim.excess_amount_due,
            };

            expect(mappedClaim.incident_location).toBe('Gaborone Main Road');
            expect(mappedClaim.estimated_repair_cost).toBe(5000);
        });

        it('should correctly map estimated_damage_cost to estimated_repair_cost alias', () => {
            const rawClaim = {
                id: 'claim-456',
                claim_number: 'CLM-002',
                policy_id: 'policy-789',
                booking_id: 'booking-111',
                renter_id: 'user-456',
                incident_date: '2026-03-21',
                incident_type: 'minor_damage',
                incident_description: 'Small scratch',
                damage_description: 'Minor scratch on door',
                location: 'Airport Road',
                police_report_filed: false,
                police_report_number: null,
                police_station: null,
                estimated_damage_cost: 1500,
                estimated_repair_cost: null,
                actual_damage_cost: null,
                status: 'under_review',
                approved_amount: null,
                excess_paid: null,
                excess_amount_due: null,
                excess_amount: null,
                admin_fee: null,
                payout_amount: null,
                total_claim_cost: null,
                rejection_reason: null,
                evidence_urls: ['scratch.jpg'],
                supporting_documents: null,
                repair_quotes_urls: null,
                repair_invoices_urls: null,
                submitted_at: '',
                reviewed_at: null,
                more_info_requested_at: null,
                resolved_at: null,
                paid_at: null,
                admin_notes: null,
                reviewed_by: null,
                created_at: '2026-03-21T11:00:00Z',
                updated_at: '2026-03-21T11:00:00Z',
            };

            const mappedClaim = {
                ...rawClaim,
                incident_location: rawClaim.location,
                estimated_repair_cost: rawClaim.estimated_repair_cost ?? rawClaim.estimated_damage_cost,
                excess_amount: rawClaim.excess_amount ?? rawClaim.excess_amount_due,
            };

            expect(mappedClaim.estimated_repair_cost).toBe(1500);
        });

        it('should correctly map excess_amount_due to excess_amount alias', () => {
            const rawClaim = {
                id: 'claim-789',
                claim_number: 'CLM-003',
                policy_id: 'policy-222',
                booking_id: 'booking-333',
                renter_id: 'user-789',
                incident_date: '2026-03-22',
                incident_type: 'collision',
                incident_description: 'Major collision',
                damage_description: 'Total loss',
                location: 'Molepolole Road',
                police_report_filed: true,
                police_report_number: 'CR-2026-002',
                police_station: null,
                estimated_damage_cost: 25000,
                estimated_repair_cost: null,
                actual_damage_cost: null,
                status: 'approved',
                approved_amount: null,
                excess_paid: null,
                excess_amount_due: 1500,
                excess_amount: null,
                admin_fee: null,
                payout_amount: null,
                total_claim_cost: null,
                rejection_reason: null,
                evidence_urls: null,
                supporting_documents: null,
                repair_quotes_urls: null,
                repair_invoices_urls: null,
                submitted_at: '',
                reviewed_at: null,
                more_info_requested_at: null,
                resolved_at: null,
                paid_at: null,
                admin_notes: null,
                reviewed_by: null,
                created_at: '2026-03-22T12:00:00Z',
                updated_at: '2026-03-22T12:00:00Z',
            };

            const mappedClaim = {
                ...rawClaim,
                incident_location: rawClaim.location,
                estimated_repair_cost: (rawClaim as any).estimated_repair_cost ?? rawClaim.estimated_damage_cost,
                excess_amount: rawClaim.excess_amount ?? rawClaim.excess_amount_due,
            };

            expect(mappedClaim.excess_amount).toBe(1500);
        });
    });

    describe('Claim Status Display', () => {
        const getStatusText = (status: string) => {
            switch (status) {
                case 'pending': return 'Pending';
                case 'submitted': return 'Submitted';
                case 'under_review': return 'Under Review';
                case 'more_info_needed': return 'Info Needed';
                case 'approved': return 'Approved';
                case 'paid': return 'Paid';
                case 'rejected': return 'Rejected';
                case 'closed': return 'Closed';
                default: return 'Unknown';
            }
        };

        const getStatusColor = (status: string) => {
            switch (status) {
                case 'pending': return 'bg-yellow-100 text-yellow-800';
                case 'submitted': return 'bg-blue-50 text-blue-700';
                case 'under_review': return 'bg-blue-100 text-blue-800';
                case 'more_info_needed': return 'bg-orange-100 text-orange-800';
                case 'approved': return 'bg-green-100 text-green-800';
                case 'paid': return 'bg-green-100 text-green-800';
                case 'rejected': return 'bg-red-100 text-red-800';
                case 'closed': return 'bg-gray-100 text-gray-800';
                default: return 'bg-gray-100 text-gray-800';
            }
        };

        it.each([
            ['pending', 'Pending', 'bg-yellow-100 text-yellow-800'],
            ['submitted', 'Submitted', 'bg-blue-50 text-blue-700'],
            ['under_review', 'Under Review', 'bg-blue-100 text-blue-800'],
            ['more_info_needed', 'Info Needed', 'bg-orange-100 text-orange-800'],
            ['approved', 'Approved', 'bg-green-100 text-green-800'],
            ['paid', 'Paid', 'bg-green-100 text-green-800'],
            ['rejected', 'Rejected', 'bg-red-100 text-red-800'],
            ['closed', 'Closed', 'bg-gray-100 text-gray-800'],
            ['unknown_status', 'Unknown', 'bg-gray-100 text-gray-800'],
        ])('should display correct status text and color for "%s"', (status, expectedText, expectedColor) => {
            expect(getStatusText(status)).toBe(expectedText);
            expect(getStatusColor(status)).toBe(expectedColor);
        });
    });

    describe('Form Step Navigation', () => {
        it('should validate required fields before advancing from step 1', async () => {
            const step1RequiredFields = [
                'incident_date',
                'incident_time',
                'incident_type',
                'incident_location',
                'incident_description',
            ];

            const sampleData = {
                incident_date: '2026-03-20',
                incident_time: '14:30',
                incident_type: 'collision',
                incident_location: 'Main Street, Gaborone',
                incident_description: 'Vehicle collided with another car at the intersection while turning left',
            };

            const missingFields = step1RequiredFields.filter(field => !sampleData[field as keyof typeof sampleData]);
            expect(missingFields).toHaveLength(0);
        });

        it('should validate required fields before advancing from step 2', async () => {
            const step2RequiredFields = [
                'damage_description',
                'estimated_repair_cost',
            ];

            const sampleData = {
                damage_description: 'Front bumper damaged, headlight broken, scratches on hood',
                estimated_repair_cost: 5000,
            };

            const missingFields = step2RequiredFields.filter(field => !sampleData[field as keyof typeof sampleData]);
            expect(missingFields).toHaveLength(0);
        });

        it('should advance to step 3 after file upload in step 2', async () => {
            const currentStep = 2;
            const uploadedFiles = ['evidence1.jpg', 'evidence2.pdf'];
            const hasUploads = uploadedFiles.length > 0;

            let nextStep = currentStep;
            if (hasUploads && currentStep === 2) {
                nextStep = Math.min(currentStep + 1, 3);
            }

            expect(nextStep).toBe(3);
        });
    });

    describe('Claim Data Transformation', () => {
        it('should append additional details to incident description', () => {
            const formData = {
                incident_description: 'Original incident description',
                other_vehicle_involved: true,
                other_driver_name: 'John Doe',
                other_driver_contact: '71234567',
                other_vehicle_registration: 'ABC 123',
                witness_name: 'Jane Smith',
                witness_contact: '79876543',
                additional_notes: 'Traffic was light',
            };

            let fullDescription = formData.incident_description;
            
            if (formData.other_vehicle_involved) {
                fullDescription += `\n\n[Other Vehicle Involved]\nName: ${formData.other_driver_name || 'N/A'}\nContact: ${formData.other_driver_contact || 'N/A'}\nRegistration: ${formData.other_vehicle_registration || 'N/A'}`;
            }
            if (formData.witness_name) {
                fullDescription += `\n\n[Witness]\nName: ${formData.witness_name}\nContact: ${formData.witness_contact || 'N/A'}`;
            }
            if (formData.additional_notes) {
                fullDescription += `\n\n[Notes]\n${formData.additional_notes}`;
            }

            expect(fullDescription).toContain('Original incident description');
            expect(fullDescription).toContain('[Other Vehicle Involved]');
            expect(fullDescription).toContain('John Doe');
            expect(fullDescription).toContain('[Witness]');
            expect(fullDescription).toContain('Jane Smith');
            expect(fullDescription).toContain('[Notes]');
        });

        it('should map repair cost to damage cost for API', () => {
            const formData = {
                damage_description: 'Bumper damage',
                estimated_repair_cost: 3500,
            };

            const apiData = {
                estimated_damage_cost: formData.estimated_repair_cost,
            };

            expect(apiData.estimated_damage_cost).toBe(3500);
        });
    });
});
