'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Storage } from '@/lib/storage';
import { initialData, generateId, formatCurrency } from '@/lib/data';
import Modal from '@/components/UI/Modal';
import Toast from '@/components/UI/Toast';
import Layout from '@/components/Layout/Layout';

export default function Customers() {
    const [data, setData] = useState(initialData);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const savedData = Storage.getData();
        if (savedData) setData(savedData);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const filteredCustomers = data.customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
    );

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    });

    const openModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name,
                phone: customer.phone || '',
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                name: '',
                phone: '',
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const customerData = {
            name: formData.name,
            phone: formData.phone,
        };

        if (editingCustomer) {
            // Update existing customer
            const updatedCustomers = data.customers.map(c =>
                c.id === editingCustomer.id
                    ? { ...c, ...customerData }
                    : c
            );
            setData(prev => ({ ...prev, customers: updatedCustomers }));
            Storage.saveData({ ...data, customers: updatedCustomers });
            showToast('Customer updated successfully');
        } else {
            // Add new customer
            const newCustomer = {
                ...customerData,
                id: generateId(),
                totalSpent: 0,
                createdAt: new Date().toISOString()
            };
            const updatedCustomers = [...data.customers, newCustomer];
            setData(prev => ({ ...prev, customers: updatedCustomers }));
            Storage.saveData({ ...data, customers: updatedCustomers });
            showToast('Customer added successfully');
        }

        closeModal();
    };

    const deleteCustomer = (customerId) => {
        // Check if customer has invoices
        const customerInvoices = data.invoices.filter(inv => inv.customerId === customerId);
        if (customerInvoices.length > 0) {
            showToast('Cannot delete customer with invoices. Delete invoices first.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this customer?')) {
            const updatedCustomers = data.customers.filter(c => c.id !== customerId);
            setData(prev => ({ ...prev, customers: updatedCustomers }));
            Storage.saveData({ ...data, customers: updatedCustomers });
            showToast('Customer deleted successfully');
        }
    };

    const getTotalSpent = (customerId) => {
        const customerInvoices = data.invoices.filter(inv => inv.customerId === customerId);
        return customerInvoices.reduce((sum, inv) => sum + inv.total, 0);
    };

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Customer Management</h1>
                    <button
                        onClick={() => openModal()}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Customer</span>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search customers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                </div>

                {/* Customers Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Total Spent
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-primary font-semibold text-sm">
                                                    {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {customer.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {customer.phone || 'No phone'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(getTotalSpent(customer.id))}
                                    </td>
                                    <td className="px-6 py-4 text-sm space-x-2">
                                        <button
                                            onClick={() => openModal(customer)}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteCustomer(customer.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredCustomers.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No customers found. {searchTerm && 'Try changing your search terms.'}
                        </div>
                    )}
                </div>

                {/* Customer Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Phone
                            </label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="input-field"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                {editingCustomer ? 'Update' : 'Add'} Customer
                            </button>
                        </div>
                    </form>
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