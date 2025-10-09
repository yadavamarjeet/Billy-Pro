export class WhatsAppService {
    static shareInvoice(invoice, data) {
        if (!invoice.customerPhone) {
            console.log('Customer phone number not available for this invoice');
            return;
        }

        // Format date
        const invoiceDate = invoice.createdAt

        // Format items list
        const itemsList = invoice.items.map(item =>
            `• ${item.name} - ${item.quantity} x ₹${item.price.toFixed(2)} = ₹${item.total.toFixed(2)}`
        ).join('\n');

        // Calculate totals with discount
        const subtotal = invoice.subtotal || invoice.items.reduce((sum, item) => sum + item.total, 0);
        const discount = invoice.discount || 0;
        const total = invoice.total || Math.max(0, subtotal - discount);

        const businessInfo = {
            businessName: data.settings.businessName,
            businessAddress: data.settings.businessAddress,
            businessPhone: data.settings.businessPhone,
            businessEmail: data.settings.businessEmail
        };

        // Create detailed message with emojis and formatting
        const message = `Dear ${invoice.customerName},\n\nYour invoice ${invoice.number} from ${businessInfo.businessName} is ready.\n\nInvoice Date: ${invoice.createdAt}\n\nItems Purchased:\n${invoice.items.map((item, index) => `${index + 1}. ${item.name} (${item.quantity} x ₹${item.price.toFixed(2)}) = ₹${item.total.toFixed(2)}`).join('\n')}\n\nAmount Summary:\nSubtotal: ₹${subtotal.toFixed(2)}\nDiscount: ₹${discount.toFixed(2)}\nGrand Total: ₹${total.toFixed(2)}\n\nBusiness Information:\n${businessInfo.businessName}${businessInfo.businessAddress ? `\n${businessInfo.businessAddress}` : ''}${businessInfo.businessPhone ? `\n${businessInfo.businessPhone}` : ''}${businessInfo.businessEmail ? `\n${businessInfo.businessEmail}` : ''}\n\nThank you for your business!\nWe appreciate your trust in us.`;

        const cleanPhone = invoice.customerPhone.replace(/\D/g, '');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        } else {
            return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        }
    }


    static shareInvoiceWithPDF(invoice, businessName, pdfUrl = null) {
        const baseMessage = `Hello ${invoice.customerName},\n\nYour invoice ${invoice.number} from ${businessName} is ready.\nTotal Amount: ₹${invoice.total.toFixed(2)}`;

        const message = pdfUrl
            ? `${baseMessage}\n\nDownload your invoice: ${pdfUrl}`
            : `${baseMessage}\n\nPlease find your invoice attached.`;

        if (!invoice.customerPhone) {
            throw new Error('Customer phone number not available for this invoice');
        }

        const cleanPhone = invoice.customerPhone.replace(/\D/g, '');
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        } else {
            return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        }
    }
}