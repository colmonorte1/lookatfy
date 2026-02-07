/**
 * Generate Invoice PDF for a booking/payment
 * This uses jsPDF library for PDF generation
 */

export interface InvoiceData {
    id: string;
    date: string;
    userName: string;
    userEmail?: string;
    expertName: string;
    serviceName?: string;
    price: number;
    currency: string;
    fee: number;
    netAmount: number;
    status: string;
    bookingDate?: string;
    bookingTime?: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
    // Dynamically import jsPDF to avoid SSR issues
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor = [79, 70, 229]; // Indigo
    const secondaryColor = [107, 114, 128]; // Gray
    const successColor = [34, 197, 94]; // Green

    // Header - Company Logo/Name
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('LOOKATFY', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Plataforma de Consultas Profesionales', 20, 32);

    // Invoice Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', pageWidth - 20, 25, { align: 'right' });

    // Invoice Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Factura No: ${data.id.slice(0, 12).toUpperCase()}`, pageWidth - 20, 32, { align: 'right' });

    const invoiceDate = new Date(data.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    doc.text(`Fecha: ${invoiceDate}`, pageWidth - 20, 38, { align: 'right' });

    // Customer Information
    let yPos = 60;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CLIENTE', 20, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Nombre: ${data.userName}`, 20, yPos);

    if (data.userEmail) {
        yPos += 6;
        doc.text(`Email: ${data.userEmail}`, 20, yPos);
    }

    // Expert Information
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('EXPERTO', 20, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Nombre: ${data.expertName}`, 20, yPos);

    // Service Details
    if (data.serviceName) {
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('SERVICIO', 20, yPos);

        yPos += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(`Descripción: ${data.serviceName}`, 20, yPos);

        if (data.bookingDate && data.bookingTime) {
            yPos += 6;
            doc.text(`Fecha de sesión: ${new Date(data.bookingDate).toLocaleDateString('es-ES')} a las ${data.bookingTime}`, 20, yPos);
        }
    }

    // Payment Details Table
    yPos += 20;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 8, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('CONCEPTO', 25, yPos + 5);
    doc.text('MONTO', pageWidth - 25, yPos + 5, { align: 'right' });

    yPos += 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    // Price
    doc.text('Precio del servicio', 25, yPos);
    doc.text(formatMoney(data.price, data.currency), pageWidth - 25, yPos, { align: 'right' });

    // Fee
    yPos += 8;
    doc.text('Comisión de plataforma', 25, yPos);
    doc.text(formatMoney(data.fee, data.currency), pageWidth - 25, yPos, { align: 'right' });

    // Line separator
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    // Total
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text('TOTAL PAGADO', 25, yPos);
    doc.text(formatMoney(data.price, data.currency), pageWidth - 25, yPos, { align: 'right' });

    // Net amount for expert
    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.text('Monto neto para experto', 25, yPos);
    doc.text(formatMoney(data.netAmount, data.currency), pageWidth - 25, yPos, { align: 'right' });

    // Status
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    const statusText = data.status === 'completed' ? 'COMPLETADO' :
                       data.status === 'confirmed' ? 'CONFIRMADO' :
                       data.status === 'pending' ? 'PENDIENTE' : data.status.toUpperCase();

    const statusColor = data.status === 'completed' ? successColor :
                        data.status === 'confirmed' ? primaryColor :
                        [234, 179, 8]; // Yellow for pending

    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.roundedRect(20, yPos - 4, 40, 8, 2, 2, 'F');
    doc.text(statusText, 40, yPos + 1, { align: 'center' });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, footerY, pageWidth - 20, footerY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('LOOKATFY - Plataforma de Consultas Profesionales', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text('Este documento es una factura válida de pago', pageWidth / 2, footerY + 14, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, footerY + 20, { align: 'center' });

    // Save the PDF
    doc.save(`factura_${data.id.slice(0, 8)}.pdf`);
}

function formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currency || 'USD'
    }).format(amount);
}
