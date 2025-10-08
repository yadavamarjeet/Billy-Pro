export const downloadInvoicePDF = async (invoice, data, showToast = null) => {

    // Only import html2pdf on client side
    if (typeof window === 'undefined') {
        if (showToast) showToast('PDF download is only available in browser', 'error');
        return;
    }

    try {

        // Dynamic import for client-side only
        const html2pdf = (await import('html2pdf.js')).default;
        const { formatDate } = await import('./data');

        const element = document.createElement('div');
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Invoice ${invoice.number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            background: #ffffff;
            line-height: 1.4;
            font-size: 12px;
        }
        
        .invoice-container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
        }
        
        /* Simple Header */
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #4f46e5;
            background: #4f46e5;
            color: white;
            padding: 30px 20px;
            margin: -20px -20px 30px -20px;
        }
        
        .business-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .business-info {
            font-size: 12px;
            margin-bottom: 3px;
            opacity: 0.9;
        }
        
        /* Simple Table Layout */
        .details-section {
            margin-top: 25px;
            margin-bottom: 25px;
        }
        
        .details-row {
            display: table;
            width: 100%;
            margin-bottom: 15px;
        }
        
        .invoice-details, .customer-details {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
        }
        
        .section-title {
            color: #4f46e5;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }
        
        .detail-item {
            margin-bottom: 5px;
            display: table;
            width: 100%;
        }
        
        .detail-label {
            display: table-cell;
            width: 40%;
            font-weight: 500;
            color: #666;
            padding: 2px 0;
        }
        
        .detail-value {
            display: table-cell;
            width: 60%;
            font-weight: 600;
            color: #333;
            padding: 2px 0;
        }
        
        /* Simple Table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 11px;
        }
        
        .items-table th {
            background: #4f46e5;
            color: white;
            padding: 8px 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #4f46e5;
        }
        
        .items-table td {
            padding: 8px 10px;
            border: 1px solid #ddd;
        }
        
        .items-table .item-total {
            font-weight: bold;
            color: #059669;
        }
        
        /* Totals Section */
        .totals-section {
            margin-bottom: 25px;
            border: 1px solid #ddd;
            padding: 15px;
        }
        
        .total-row {
            display: table;
            width: 100%;
            margin-bottom: 5px;
        }
        
        .total-label {
            display: table-cell;
            width: 70%;
            font-weight: 500;
            padding: 3px 0;
        }
        
        .total-value {
            display: table-cell;
            width: 30%;
            font-weight: 600;
            text-align: right;
            padding: 3px 0;
        }
        
        .grand-total {
            border-top: 2px solid #4f46e5;
            padding-top: 8px;
            margin-top: 8px;
            font-size: 14px;
        }
        
        .grand-total .total-label {
            font-weight: bold;
            color: #4f46e5;
        }
        
        .grand-total .total-value {
            font-weight: bold;
            color: #059669;
            font-size: 16px;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 11px;
        }
        
        .thank-you {
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 5px;
        }
        
        /* Print-specific styles */
        @media print {
            body {
                padding: 0;
                margin: 0;
            }
            
            .invoice-container {
                max-width: 100%;
            }
            
            .header {
                margin: 0;
            }
            
            /* Ensure colors print */
            * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        /* Hide from screen but show in print */
        .print-only {
            display: none;
        }
        
        @media print {
            .print-only {
                display: block;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <h1 class="business-name">${data.settings.businessName}</h1>
            <p class="business-info">${data.settings.businessAddress}</p>
            <p class="business-info">${data.settings.businessPhone} • ${data.settings.businessEmail}</p>
        </div>
        
        <!-- Invoice & Customer Details -->
        <div class="details-section">
            <div class="details-row">
                <div class="invoice-details">
                    <div class="section-title">Invoice Details</div>
                    <div class="detail-item">
                        <span class="detail-label">Invoice Number:</span>
                        <span class="detail-value">${invoice.number}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Invoice Date:</span>
                        <span class="detail-value">${formatDate(invoice.createdAt)}</span>
                    </div>
                </div>
                
                <div class="customer-details">
                    <div class="section-title">Bill To</div>
                    <div class="detail-item">
                        <span class="detail-label">Customer Name:</span>
                        <span class="detail-value">${invoice.customerName}</span>
                    </div>
                    ${invoice.customerPhone ? `
                    <div class="detail-item">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${invoice.customerPhone}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th>Unit Price (₹)</th>
                    <th>Qty</th>
                    <th>Total (₹)</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        <td class="item-total">₹${item.total.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Totals Section -->
        <div class="totals-section">
            <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">₹${invoice.subtotal.toFixed(2)}</span>
            </div>
            ${invoice.discount > 0 ? `
            <div class="total-row">
                <span class="total-label">Discount:</span>
                <span class="total-value" style="color: #dc2626;">-₹${invoice.discount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${invoice.tax > 0 ? `
            <div class="total-row">
                <span class="total-label">Tax:</span>
                <span class="total-value">₹${invoice.tax.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
                <span class="total-label">GRAND TOTAL:</span>
                <span class="total-value">₹${invoice.total.toFixed(2)}</span>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="thank-you">Thank you for your business!</p>
            <p>If you have any questions about this invoice, please contact</p>
            <p>${data.settings.businessEmail} or ${data.settings.businessPhone}</p>
            <p style="margin-top: 10px; margin-bottom: 20px;">
                Generated on ${new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
            </p>
        </div>
    </div>
</body>
</html>`;

        element.innerHTML = htmlContent;

        const opt = {
            margin: 8,
            filename: `invoice-${invoice.number}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Download directly without preview
        await html2pdf()
            .set(opt)
            .from(element)
            .save()
            .then(() => {
                console.log('PDF downloaded successfully');
            })
            .catch((error) => {
                console.error('PDF generation error:', error);
            });

    } catch (error) {
        console.error('Error generating PDF:', error);
    }
};