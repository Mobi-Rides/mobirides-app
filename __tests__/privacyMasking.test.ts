import {
  maskNationalId,
  maskPhone,
  maskEmergencyName,
  maskRelationship,
  formatAddress,
} from '@/utils/privacyMasking';

describe('privacyMasking utils', () => {
  it('masks national id using only last 4 chars', () => {
    expect(maskNationalId('123456789')).toBe('****6789');
    expect(maskNationalId('')).toBe('');
  });

  it('masks phone while preserving last 3 digits', () => {
    expect(maskPhone('+267 7123 4567')).toBe('**** *** 567');
    expect(maskPhone('12')).toBe('12');
    expect(maskPhone('')).toBe('');
  });

  it('masks emergency name fully', () => {
    expect(maskEmergencyName('John Doe')).toBe('****');
    expect(maskEmergencyName('')).toBe('');
  });

  it('masks relationship up to 8 characters', () => {
    expect(maskRelationship('Sister')).toBe('******');
    expect(maskRelationship('LongRelationshipValue')).toBe('********');
    expect(maskRelationship('')).toBe('');
  });

  it('formats address using available non-empty parts', () => {
    expect(formatAddress({ street: '1 Main', area: 'CBD', city: 'Gaborone', postalCode: '0001' }))
      .toBe('1 Main, CBD, Gaborone, 0001');

    expect(formatAddress({ street: '1 Main', area: '', city: 'Gaborone' }))
      .toBe('1 Main, Gaborone');
  });
});
