'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Storage } from '@/lib/storage';
import { initialData, generateId, formatCurrency } from '@/lib/data';
import Modal from '@/components/UI/Modal';
import Toast from '@/components/UI/Toast';
import Layout from '@/components/Layout/Layout';

export default function Products() {
    const [data, setData] = useState(initialData);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const savedData = Storage.getData();
        if (savedData) setData(savedData);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const filteredProducts = data.products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        price: '',
        stock: '',
        description: ''
    });

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                categoryId: product.categoryId || '',
                price: product.price.toString(),
                stock: product.stock?.toString() || '',
                description: product.description || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                categoryId: '',
                price: '',
                stock: '',
                description: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const productData = {
            name: formData.name,
            categoryId: formData.categoryId || null,
            price: parseFloat(formData.price),
            stock: formData.stock ? parseInt(formData.stock) : null,
            description: formData.description
        };

        if (editingProduct) {
            // Update existing product
            const updatedProducts = data.products.map(p =>
                p.id === editingProduct.id
                    ? { ...p, ...productData }
                    : p
            );
            setData(prev => ({ ...prev, products: updatedProducts }));
            Storage.saveData({ ...data, products: updatedProducts });
            showToast('Product updated successfully');
        } else {
            // Add new product
            const newProduct = {
                ...productData,
                id: generateId(),
                createdAt: new Date().toISOString()
            };
            const updatedProducts = [...data.products, newProduct];
            setData(prev => ({ ...prev, products: updatedProducts }));
            Storage.saveData({ ...data, products: updatedProducts });
            showToast('Product added successfully');
        }

        closeModal();
    };

    const deleteProduct = (productId) => {
        if (confirm('Are you sure you want to delete this product?')) {
            const updatedProducts = data.products.filter(p => p.id !== productId);
            setData(prev => ({ ...prev, products: updatedProducts }));
            Storage.saveData({ ...data, products: updatedProducts });
            showToast('Product deleted successfully');
        }
    };

    const getCategoryName = (categoryId) => {
        const category = data.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Uncategorized';
    };

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Product Management</h1>
                    <button
                        onClick={() => openModal()}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center mr-3">
                                                <span className="text-gray-500 text-sm">📦</span>
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {product.name}
                                                </div>
                                                {product.description && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {product.description.length > 50
                                                            ? `${product.description.substring(0, 50)}...`
                                                            : product.description
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {getCategoryName(product.categoryId)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(product.price)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {product.stock || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm space-x-2">
                                        <button
                                            onClick={() => openModal(product)}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteProduct(product.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No products found. {searchTerm && 'Try changing your search terms.'}
                        </div>
                    )}
                </div>

                {/* Product Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title={editingProduct ? 'Edit Product' : 'Add Product'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Product Name *
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
                                Category
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                                className="input-field"
                            >
                                <option value="">Select Category</option>
                                {data.categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Price (₹) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Stock Quantity
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                rows="3"
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
                                {editingProduct ? 'Update' : 'Add'} Product
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