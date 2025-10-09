'use client';

import { IndianRupee, FileText, Award } from 'lucide-react';
import { formatCurrency, initialData } from '@/lib/data';
import { Storage } from '@/lib/storage';
import { useEffect, useState } from 'react';


export default function StatsCards({ invoices }) {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        (async () => {
            const savedData = await Storage.getData();
            if (savedData) setData(savedData);
        })();
    }, []);

    const totalSales = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const totalInvoices = invoices.length;

    // Find top product
    const productSales = {};
    invoices.forEach(invoice => {
        invoice.items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.total;
        });
    });

    let topProduct = '-';
    let maxSales = 0;
    Object.keys(productSales).forEach(product => {
        if (productSales[product] > maxSales) {
            maxSales = productSales[product];
            topProduct = product;
        }
    });

    const stats = [
        {
            name: 'Total Sales',
            value: formatCurrency(totalSales),
            icon: IndianRupee,
            color: 'primary'
        },
        {
            name: 'Total Invoices',
            value: totalInvoices.toString(),
            icon: FileText,
            color: 'secondary'
        },
        {
            name: 'Top Product',
            value: topProduct,
            icon: Award,
            color: 'purple'
        }
    ];

    const colorClasses = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        purple: 'bg-purple-500/10 text-purple-500'
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat) => (
                <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {stat.name}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {data.settings.privacyMode && stat.name === 'Total Sales' ? `${"*".repeat(stat.value.length)}` : stat.value}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${colorClasses[stat.color]}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}