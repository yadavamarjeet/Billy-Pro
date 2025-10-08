'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { Storage } from '@/lib/storage';
import { formatCurrency, formatDate } from '@/lib/data';
import Layout from '@/components/Layout/Layout';
import { downloadInvoicePDF } from '@/lib/pdf';
import { WhatsAppService } from '@/lib/whatsapp';

export default function InvoiceDetail() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        const savedData = Storage.getData();
        if (savedData) {
            setData(savedData);
            const foundInvoice = savedData.invoices.find(inv => inv.id === params.id);
            setInvoice(foundInvoice);
        }
    }, [params.id]);

    if (!invoice) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📄</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Invoice not found
                    </h3>
                    <button
                        onClick={() => router.push('/sales')}
                        className="btn-primary"
                    >
                        Back to Sales
                    </button>
                </div>
            </div>
        );
    }

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/invoices')}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Invoice {invoice.number}
                        </h1>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => { downloadInvoicePDF(invoice, data) }}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                        </button>
                        <button
                            onClick={WhatsAppService.shareInvoice(invoice, data)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>Share via WhatsApp</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                            {data?.settings.businessName}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {data?.settings.businessAddress}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">
                            {data?.settings.businessPhone} • {data?.settings.businessEmail}
                        </p>
                    </div>

                    {/* Invoice Details */}
                    <div className="flex justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">INVOICE</h2>
                            <p className="text-gray-600 dark:text-gray-300">Number: {invoice.number}</p>
                            <p className="text-gray-600 dark:text-gray-300">Date: {formatDate(invoice.createdAt)}</p>
                        </div>
                        <div className="text-right">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Bill To</h3>
                            <p className="text-gray-600 dark:text-gray-300">{invoice.customerName}</p>
                            <p className="text-gray-600 dark:text-gray-300">{invoice.customerPhone || ''}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                                <th className="text-left py-3 text-gray-800 dark:text-white">Item</th>
                                <th className="text-right py-3 text-gray-800 dark:text-white">Price</th>
                                <th className="text-right py-3 text-gray-800 dark:text-white">Qty</th>
                                <th className="text-right py-3 text-gray-800 dark:text-white">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200 dark:border-gray-600">
                                    <td className="py-3 text-gray-800 dark:text-white">{item.name}</td>
                                    <td className="py-3 text-right text-gray-800 dark:text-white">
                                        {formatCurrency(item.price)}
                                    </td>
                                    <td className="py-3 text-right text-gray-800 dark:text-white">
                                        {item.quantity}
                                    </td>
                                    <td className="py-3 text-right text-gray-800 dark:text-white">
                                        {formatCurrency(item.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="text-right space-y-2">
                        <div className="flex justify-between max-w-xs ml-auto">
                            <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between max-w-xs ml-auto border-t border-gray-300 dark:border-gray-600 pt-2">
                            <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                            <span className="font-bold text-primary">{formatCurrency(invoice.total)}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
                        <p>Thank you for your business!</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}