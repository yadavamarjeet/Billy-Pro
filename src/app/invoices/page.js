'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    Eye,
    Download,
    Trash2,
    Edit,
} from 'lucide-react';
import { Storage } from '@/lib/storage';
import { WhatsAppService } from '@/lib/whatsapp';
import { initialData, formatDate, filterInvoicesByDate, parseCreatedAt } from '@/lib/data';
import Modal from '@/components/UI/Modal';
import Toast from '@/components/UI/Toast';
import Layout from '@/components/Layout/Layout';
import ShareButton from '@/components/Buttons/ShareButton';
import { downloadInvoicePDF } from '@/lib/pdf';


export default function Invoices() {
    const [data, setData] = useState(initialData);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const savedData = Storage.getData();
        if (savedData) setData(savedData);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    let filteredInvoices = filterInvoicesByDate(data.invoices, filter);

    // Apply search
    if (searchTerm) {
        filteredInvoices = filteredInvoices.filter(invoice =>
            invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoice.customerPhone?.includes(searchTerm)
        );
    }

    // Sort by date (newest first)
    filteredInvoices.sort((a, b) => {
        const dateA = parseCreatedAt(a.createdAt);
        const dateB = parseCreatedAt(b.createdAt);
        return dateB - dateA; // Newest first
    });

    const exportCSV = () => {
        const headers = ['Invoice Number', 'Date', 'Customer Name', 'Customer Phone', 'Items', 'Subtotal', 'Total'];
        const rows = filteredInvoices.map(invoice => [
            invoice.number,
            invoice.createdAt,
            invoice.customerName || '',
            invoice.customerPhone || '',
            invoice.items.map(item => `${item.name} x ${item.quantity}`).join('; '),
            invoice.subtotal,
            invoice.total,
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.map(field => `"${field}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('CSV exported successfully');
    };

    const confirmDelete = (invoice) => {
        setInvoiceToDelete(invoice);
        setShowDeleteModal(true);
    };

    const deleteInvoice = () => {
        if (invoiceToDelete) {
            const updatedInvoices = data.invoices.filter(inv => inv.id !== invoiceToDelete.id);
            const updatedData = { ...data, invoices: updatedInvoices };
            setData(updatedData);
            Storage.saveData(updatedData);
            showToast('Invoice deleted successfully');
            setShowDeleteModal(false);
            setInvoiceToDelete(null);
        }
    };

    // Sales view specific calculations
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

    return (
        <Layout>
            <div className="container mx-auto p-6">
                {/* Header with Toggle */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Invoices
                        </h1>
                    </div>

                    <div className="flex space-x-2">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-9 pr-3 py-1 text-sm w-64"
                            />
                        </div>

                        <button
                            onClick={exportCSV}
                            className="btn-secondary flex items-center space-x-2 text-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV</span>
                        </button>

                        <Link
                            href="/invoices/create"
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Invoice</span>
                        </Link>
                    </div>
                </div>

                {/* Summary Stats - Enhanced for both views */}
                {filteredInvoices.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                            <div className="text-xl font-bold text-primary">
                                {filteredInvoices.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">Total Invoices</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                            <div className="text-xl font-bold text-secondary">
                                ₹{totalRevenue.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">Total Revenue</div>
                        </div>
                    </div>
                )}

                {/* Invoices/Sales Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Invoice #
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-primary">
                                            {invoice.number}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {invoice.items.length} items
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {formatDate(invoice.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {invoice.customerName}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {invoice.customerPhone || 'No phone'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                                        ₹{invoice.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <Link
                                                href={`/invoices/view/${invoice.id}`}
                                                className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10"
                                                title="View Invoice"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                            <Link
                                                href={`/invoices/${invoice.id}`}
                                                className="text-primary hover:text-primary/80 p-1 rounded hover:bg-primary/10"
                                                title="Edit Invoice"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <ShareButton invoice={invoice} data={data} />
                                            <button
                                                onClick={() => { downloadInvoicePDF(invoice, data) }}
                                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900"
                                                title="Download PDF"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(invoice)}
                                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                                title="Delete Invoice"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredInvoices.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-400 dark:text-gray-500 mb-4">
                                <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">
                                        📄
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No invoices found
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {searchTerm || filter !== 'all'
                                    ? 'Try changing your search or filter criteria.'
                                    : `Get started by creating your first invoice.`
                                }
                            </p>
                            {!searchTerm && filter === 'all' && (
                                <Link
                                    href="/invoices/create"
                                    className="btn-primary"
                                >
                                    Create Your First Invoice
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Delete Invoice"
                >
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            Are you sure you want to delete invoice <strong>{invoiceToDelete?.number}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteInvoice}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                            >
                                Delete Invoice
                            </button>
                        </div>
                    </div>
                </Modal>

                <Toast
                    isVisible={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast(prev => ({ ...prev, show: false }))}
                />
            </div>
        </Layout>
    );
}