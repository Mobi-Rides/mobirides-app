export const maskNationalId = (id: string): string => {
  if (!id) return '';
  return `****${id.slice(-4)}`;
};

export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 3) return phone;
  return `**** *** ${digits.slice(-3)}`;
};

export const maskEmergencyName = (name: string): string => {
  if (!name) return '';
  return '****';
};

export const maskRelationship = (relationship: string): string => {
  if (!relationship) return '';
  return '*'.repeat(Math.min(relationship.length, 8));
};

export const formatAddress = (address: {
  street: string;
  area: string;
  city: string;
  postalCode?: string;
}): string => {
  const parts = [
    address.street,
    address.area,
    address.city,
    address.postalCode
  ].filter(Boolean);
  
  return parts.join(', ');
};
