'use client';

import Link from 'next/link';
import { Edit, Eye, Share2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/data';
import clsx from 'clsx';
import ShareButton from '../Buttons/ShareButton';

export default function RecentInvoices({ invoices }) {
    const recentInvoices = invoices
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .reverse();

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Recent Invoices
            </h3>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Invoice #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {recentInvoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-4 py-4 text-sm font-medium text-primary">
                                    {invoice.number}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                    {formatDate(invoice.createdAt)}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                    {invoice.customerName}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                    {formatCurrency(invoice.total)}
                                </td>
                                <td className="flex items-center space-x-2 px-4 py-4 text-sm">
                                    <Link
                                        href={`/invoices/view/${invoice.id}`}
                                        className="text-primary hover:text-primary/80"
                                        title="View Invoice"
                                    >
                                        <Eye className="w-4 h-4 inline" />
                                    </Link>
                                    <Link
                                        href={`/invoices/${invoice.id}`}
                                        className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10"
                                        title="Edit Invoice"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <ShareButton invoice={invoice} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}