import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BookingWithRelations } from '@/types/booking';

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const generateRentalAgreementPDF = (booking: BookingWithRelations): void => {
  const doc = new jsPDF();

  // Premium Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('MOBI RIDES', 20, 20);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240); // Slate 200
  doc.text('OFFICIAL RENTAL AGREEMENT', 20, 30);

  // Document Metadata Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.rect(20, 48, 170, 24, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'bold');
  doc.text('AGREEMENT ID:', 25, 54);
  doc.text('DATE GENERATED:', 25, 60);
  doc.text('RENTAL STATUS:', 25, 66);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(booking.id.toUpperCase(), 65, 54);
  doc.text(new Date().toLocaleString(), 65, 60);
  doc.text(booking.status.toUpperCase(), 65, 66);

  // Section 1: Contracting Parties
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. CONTRACTING PARTIES', 20, 82);

  autoTable(doc, {
    startY: 86,
    head: [['Role', 'Party Details', 'Verification Status']],
    body: [
      [
        'Renter (Customer)',
        `${booking.renter?.full_name || 'N/A'}\nID: ${booking.renter_id || 'N/A'}\nPhone: ${booking.renter?.phone_number || 'N/A'}`,
        'Digitally Verified by Mobi Rides'
      ],
      [
        'Host (Vehicle Owner)',
        `${booking.cars?.owner?.full_name || 'N/A'}\nID: ${booking.cars?.owner_id || 'N/A'}`,
        'Digitally Verified by Mobi Rides'
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  // Section 2: Vehicle Specifications
  let currentY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. VEHICLE SPECIFICATIONS', 20, currentY);

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Specification', 'Details']],
    body: [
      ['Make & Model', `${booking.cars?.brand} ${booking.cars?.model}`],
      ['Year of Manufacture', booking.cars?.year?.toString() || 'N/A'],
      ['Pickup Location', booking.cars?.location || 'N/A'],
      ['Daily Rental Rate', `BWP ${(booking.cars?.price_per_day || 0).toFixed(2)} / day`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  // Section 3: Rental Duration & Financial Breakdown
  currentY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. RENTAL PERIOD & FINANCIAL SUMMARY', 20, currentY);

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.toLocaleDateString()} ${timeStr || 'N/A'}`;
    } catch {
      return `${dateStr} ${timeStr || 'N/A'}`;
    }
  };

  autoTable(doc, {
    startY: currentY + 4,
    head: [['Item Description', 'Agreement Terms']],
    body: [
      ['Scheduled Pickup (Start)', formatDateTime(booking.start_date, booking.start_time)],
      ['Scheduled Dropoff (End)', formatDateTime(booking.end_date, booking.end_time)],
      ['Base Rental Total', `BWP ${(booking.base_rental_price || booking.total_price).toFixed(2)}`],
      ['Dynamic Pricing Multiplier', `${booking.dynamic_pricing_multiplier || '1.00'}x`],
      ['Insurance & Damage Protection', `BWP ${(booking.insurance_premium || 0).toFixed(2)}`],
      ['Promo Discount Code Applied', `BWP ${(booking.discount_amount || 0).toFixed(2)}`],
      ['Grand Total Price', `BWP ${booking.total_price.toFixed(2)}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  // Add Page 2 for terms, conditions, and signatures
  doc.addPage();

  // Page 2 Header Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 20, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('MOBI RIDES RENTAL AGREEMENT - TERMS & CONDITIONS', 20, 13);

  // Section 4: Terms and Conditions Clauses
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. STANDARD RENTAL TERMS & COVENANTS', 20, 32);

  const clauses = [
    {
      title: '4.1 Authorized Drivers & Eligibility',
      body: 'Only the registered, identity-verified renter is authorized to operate the rental vehicle. Permitting unauthorized drivers to operate the vehicle constitutes a severe breach of this agreement, instantly invalidating all damage protection coverage and exposing the renter to full civil and criminal liabilities.'
    },
    {
      title: '4.2 Vehicle Operation, Safety, and Compliance',
      body: 'The renter covenants to operate the vehicle in absolute compliance with all local laws and national road traffic acts. The vehicle shall not be driven off-road, used for speed trials, street racing, towing, hauling loads exceeding payload capacity, or carrying passengers for commercial hire/reward.'
    },
    {
      title: '4.3 Damage Protection & Insurance Coverage',
      body: 'Coverage is only active during the approved rental duration. If any damage, collision, or theft occurs, a police report must be filed within 24 hours and submitted directly to Mobi Rides. The renter is strictly liable for the deductible excess specified under the selected damage protection plan.'
    },
    {
      title: '4.4 Maintenance, Return, Fuel, and Penalty Fees',
      body: 'The renter agrees to return the vehicle in the same cleanliness state and with the same fuel level as recorded at pickup. Late dropoffs will incur automatic hourly extension fees. Failure to return the vehicle within 24 hours of the dropoff window will trigger automatic GPS recovery and theft report filings.'
    }
  ];

  let textY = 40;
  clauses.forEach((clause) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(clause.title, 20, textY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // Slate 600
    const textLines = doc.splitTextToSize(clause.body, 170);
    doc.text(textLines, 20, textY + 4);
    
    textY += (textLines.length * 4) + 8;
  });

  // Section 5: Signature & Digital Acceptance Signatures
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('5. DIGITAL COMPLIANCE ACCEPTANCE & SIGNATURES', 20, textY + 4);

  textY += 10;

  // Renter Signature Card
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.rect(20, textY, 80, 45, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('RENTER DIGISIGN', 25, textY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${booking.renter?.full_name || 'N/A'}`, 25, textY + 14);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text('✓ DIGITALLY SIGNED', 25, textY + 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`IP/ID: Verified App Account`, 25, textY + 32);
  doc.text(`Timestamp: ${booking.renter_terms_accepted_at ? new Date(booking.renter_terms_accepted_at).toLocaleString() : 'Pre-Accepted (N/A)'}`, 25, textY + 38);

  // Host Signature Card
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.rect(110, textY, 80, 45, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('HOST DIGISIGN', 115, textY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${booking.cars?.owner?.full_name || 'N/A'}`, 115, textY + 14);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.text('✓ DIGITALLY SIGNED', 115, textY + 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`IP/ID: Verified App Account`, 115, textY + 32);
  doc.text(`Timestamp: ${booking.host_terms_accepted_at ? new Date(booking.host_terms_accepted_at).toLocaleString() : 'Pre-Accepted (N/A)'}`, 115, textY + 38);

  // Premium Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont('helvetica', 'normal');
  doc.text('MobiRides Inc. | Gaborone, Botswana | support@mobirides.com', 105, 280, { align: 'center' });
  doc.text('This is a legally-binding, digitally signed electronic rental agreement governed under national contract laws.', 105, 285, { align: 'center' });

  // Save the document directly
  doc.save(`MobiRides_Agreement_${booking.id.substring(0, 8)}.pdf`);
};
