import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Order } from '../types';

export const generateInvoicePDF = async (order: Order, type: 'Facture' | 'Bon de Commande' | 'Bon de Livraison') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(type.toUpperCase(), 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Réf : ${order.orderNumber || order.id}`, 14, 30);
  doc.text(`Date : ${new Date(order.createdAt).toLocaleDateString()}`, 14, 36);

  // Company Info
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('E-Commerce SARL', 140, 22);
  doc.setTextColor(100, 116, 139);
  doc.text('123 Avenue des Champs-Élysées', 140, 28);
  doc.text('75008 Paris, France', 140, 34);
  doc.text('contact@ecommerce.com', 140, 40);
  doc.text('+33 1 23 45 67 89', 140, 46);
  doc.text('TVA: FR123456789', 140, 52);

  // Client Info
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Facturé à :', 14, 52);
  doc.setFontSize(10);
  doc.text(order.userName || 'Client', 14, 60);
  doc.setTextColor(100, 116, 139);
  const splitAddress = doc.splitTextToSize(order.address, 60);
  doc.text(splitAddress, 14, 66);
  doc.text(order.phone, 14, 66 + (splitAddress.length * 5));

  // Table
  const tableColumn = ["Description", "Quantité", "Prix Unitaire", "Total"];
  const tableRows: any[] = [];

  order.items.forEach(item => {
    const itemData = [
      item.name,
      item.quantity.toString(),
      `${item.price.toFixed(2)} Ar`,
      `${(item.price * item.quantity).toFixed(2)} Ar`
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    startY: Math.max(80, 66 + (splitAddress.length * 5) + 10),
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' },
    }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  
  if (type !== 'Bon de Livraison') {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Sous-total:', 120, finalY + 10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${(order.subtotal || order.total).toFixed(2)} Ar`, 180, finalY + 10, { align: 'right' });

    if (order.discountAmount) {
      doc.setTextColor(100, 116, 139);
      doc.text('Remise:', 120, finalY + 16);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text(`-${order.discountAmount.toFixed(2)} Ar`, 180, finalY + 16, { align: 'right' });
    }

    doc.setTextColor(100, 116, 139);
    doc.text('Frais de livraison:', 120, finalY + 22);
    doc.setTextColor(15, 23, 42);
    doc.text(`${(order.shippingFee || 0).toFixed(2)} Ar`, 180, finalY + 22, { align: 'right' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', 120, finalY + 32);
    doc.text(`${order.total.toFixed(2)} Ar`, 180, finalY + 32, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  }

  // QR Code
  try {
    const qrData = `Commande: ${order.orderNumber || order.id}\nClient: ${order.userName}\nTotal: ${order.total} Ar\nStatus: ${order.status}`;
    const qrCodeDataUri = await QRCode.toDataURL(qrData, { margin: 1 });
    doc.addImage(qrCodeDataUri, 'PNG', 14, finalY + 10, 30, 30);
  } catch (err) {
    console.error('Failed to generate QR code', err);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Merci pour votre confiance.', 105, 280, { align: 'center' });

  // Save the PDF
  doc.save(`${type.replace(/\s+/g, '_')}_${order.orderNumber || order.id}.pdf`);
};
