// Initial data structure
export const initialData = {
    products: [],
    categories: [],
    customers: [],
    invoices: [],
    settings: {
        businessName: 'Your Business Name',
        businessEmail: 'business@example.com',
        businessPhone: '+91 9876543210',
        businessAddress: '123 Business Street, City, State 12345',
        invoicePrefix: 'INV-',
        invoiceStart: 1001,
        currency: '₹'
    }
};

// Generate unique ID
export function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Calculate invoice totals
export function calculateInvoiceTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;

    return {
        subtotal,
        total
    };
}

// Format currency
export function formatCurrency(amount, currency = '₹') {
    return `${currency}${amount.toFixed(2)}`;
}

// Format date
export function formatDate(dateString) {
    return dateString;
}

// Generate invoice number
export function generateInvoiceNumber(invoices, prefix = 'INV-', start = 1001) {
    prefix = initialData.settings?.invoicePrefix || 'INV-';
    let startNumber = initialData.settings?.invoiceStart || 1000;
    
    let highestNumber = startNumber - 1;
    
    invoices.forEach(invoice => {
        if (invoice.number && invoice.number.startsWith(prefix)) {
            const numStr = invoice.number.replace(prefix, '');
            const num = parseInt(numStr);
            if (!isNaN(num) && num > highestNumber) {
                highestNumber = num;
            }
        }
    });
    
    return `${prefix}${highestNumber + 1}`;
}

export function parseCreatedAt(createdAtStr) {
    const [datePart, timePart] = createdAtStr.split(', ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [time, period] = timePart.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    // Convert 12-hour format to 24-hour
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;

    return new Date(year, month - 1, day, hours, minutes);
};


// Filter invoices by date range
export function filterInvoicesByDate(invoices, filter) {
    const now = new Date();

    // Helper function to parse "07-10-2025, 09:50 am" into a Date object
    const parseCreatedAt = (createdAtStr) => {
        const [datePart, timePart] = createdAtStr.split(', ');
        const [day, month, year] = datePart.split('-').map(Number);
        const [time, period] = timePart.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        // Convert 12-hour format to 24-hour
        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;

        return new Date(year, month - 1, day, hours, minutes);
    };

    switch (filter) {
        case 'today':
            return invoices.filter(invoice => {
                const invoiceDate = parseCreatedAt(invoice.createdAt);
                return invoiceDate.toDateString() === now.toDateString();
            });
        case 'week':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return invoices.filter(invoice => {
                const invoiceDate = parseCreatedAt(invoice.createdAt);
                return invoiceDate >= weekAgo;
            });
        case 'month':
            return invoices.filter(invoice => {
                const invoiceDate = parseCreatedAt(invoice.createdAt);
                return (
                    invoiceDate.getMonth() === now.getMonth() &&
                    invoiceDate.getFullYear() === now.getFullYear()
                );
            });
        case 'year':
            return invoices.filter(invoice => {
                const invoiceDate = parseCreatedAt(invoice.createdAt);
                return invoiceDate.getFullYear() === now.getFullYear();
            });
        default:
            return invoices;
    }
}

// Get sales trend data
export function getSalesTrendData(invoices, days = 7) {
    const labels = [];
    const values = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const daySales = invoices
            .filter(inv => inv.date === dateStr)
            .reduce((sum, inv) => sum + inv.total, 0);

        labels.push(date.toLocaleDateString('en', { weekday: 'short' }));
        values.push(daySales);
    }

    return { labels, values };
}

// Get top products data
export function getTopProductsData(invoices, limit = 5) {
    const productSales = {};

    invoices.forEach(invoice => {
        invoice.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.total;
        });
    });

    const sorted = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

    return {
        labels: sorted.map(([name]) => name),
        values: sorted.map(([, sales]) => sales)
    };
}