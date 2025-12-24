import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InsurancePolicy, InsurancePackage } from '@/services/insuranceService';

export const generatePolicyPDF = (policy: InsurancePolicy, insurancePackage: InsurancePackage, renterName: string, carDetails: string): Blob => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 102); // Dark Blue
  doc.text('MobiRides Insurance Certificate', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Policy Number: ${policy.policy_number}`, 105, 30, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 35, { align: 'center' });

  // Divider
  doc.setDrawColor(200);
  doc.line(20, 40, 190, 40);

  // Policy Details Table
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Policy Details', 20, 50);

  autoTable(doc, {
    startY: 55,
    head: [['Field', 'Value']],
    body: [
      ['Policy Holder', renterName],
      ['Vehicle', carDetails],
      ['Coverage Plan', insurancePackage.display_name],
      ['Start Date', new Date(policy.start_date).toLocaleString()],
      ['End Date', new Date(policy.end_date).toLocaleString()],
      ['Status', policy.status.toUpperCase()],
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 51, 102] },
  });

  // Coverage Details
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Coverage Summary', 20, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Item', 'Details']],
    body: [
      ['Coverage Cap', `BWP ${policy.coverage_cap?.toFixed(2) || 'N/A'}`],
      ['Excess (Deductible)', `BWP ${policy.excess_amount?.toFixed(2) || 'N/A'}`],
      ['Premium Paid', `BWP ${policy.total_premium.toFixed(2)}`],
      ['Minor Damage', insurancePackage.covers_minor_damage ? 'Covered' : 'Not Covered'],
      ['Major Incidents', insurancePackage.covers_major_incidents ? 'Covered' : 'Not Covered'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [40, 167, 69] },
  });

  // Terms
  const termsY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.text('Important Terms & Conditions', 20, termsY);
  doc.setFontSize(8);
  doc.setTextColor(80);
  
  const terms = [
    '1. This policy is valid only for the duration specified above.',
    '2. The renter is responsible for the Excess amount stated above for any claim.',
    '3. Police report is required for all major incidents (theft, collision, etc.).',
    '4. Coverage is void if the vehicle is used for illegal activities or by unauthorized drivers.',
    '5. Claims must be reported within 24 hours of the incident via the MobiRides app.',
    `6. Terms Version: ${policy.terms_version}`
  ];

  let currentY = termsY + 5;
  terms.forEach(term => {
    doc.text(term, 20, currentY);
    currentY += 5;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('MobiRides Inc. | Support: +267 71234567 | support@mobirides.com', 105, 280, { align: 'center' });
  doc.text('This is a computer-generated document and is valid without a signature.', 105, 285, { align: 'center' });

  return doc.output('blob');
};
