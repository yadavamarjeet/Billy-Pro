'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Storage } from '@/lib/storage';
import { initialData, generateId } from '@/lib/data';
import Modal from '@/components/UI/Modal';
import Toast from '@/components/UI/Toast';
import Layout from '@/components/Layout/Layout';

export default function Categories() {
    const [data, setData] = useState(initialData);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const savedData = Storage.getData();
        if (savedData) setData(savedData);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const openModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || ''
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const categoryData = {
            name: formData.name,
            description: formData.description
        };

        if (editingCategory) {
            // Update existing category
            const updatedCategories = data.categories.map(c =>
                c.id === editingCategory.id
                    ? { ...c, ...categoryData }
                    : c
            );
            setData(prev => ({ ...prev, categories: updatedCategories }));
            Storage.saveData({ ...data, categories: updatedCategories });
            showToast('Category updated successfully');
        } else {
            // Add new category
            const newCategory = {
                ...categoryData,
                id: generateId(),
                createdAt: new Date().toISOString()
            };
            const updatedCategories = [...data.categories, newCategory];
            setData(prev => ({ ...prev, categories: updatedCategories }));
            Storage.saveData({ ...data, categories: updatedCategories });
            showToast('Category added successfully');
        }

        closeModal();
    };

    const deleteCategory = (categoryId) => {
        // Check if category has products
        const productsInCategory = data.products.filter(p => p.categoryId === categoryId);
        if (productsInCategory.length > 0) {
            showToast('Cannot delete category with products. Reassign or delete products first.', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this category?')) {
            const updatedCategories = data.categories.filter(c => c.id !== categoryId);
            setData(prev => ({ ...prev, categories: updatedCategories }));
            Storage.saveData({ ...data, categories: updatedCategories });
            showToast('Category deleted successfully');
        }
    };

    const getProductCount = (categoryId) => {
        return data.products.filter(p => p.categoryId === categoryId).length;
    };

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Category Management</h1>
                    <button
                        onClick={() => openModal()}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Category</span>
                    </button>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.categories.map((category) => (
                        <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {category.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openModal(category)}
                                        className="text-primary hover:text-primary/80"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteCategory(category.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {getProductCount(category.id)} products
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {data.categories.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                            <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <span className="text-2xl">📁</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No categories yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            Get started by creating your first category.
                        </p>
                        <button
                            onClick={() => openModal()}
                            className="btn-primary"
                        >
                            Add Category
                        </button>
                    </div>
                )}

                {/* Category Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title={editingCategory ? 'Edit Category' : 'Add Category'}
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category Name *
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
                                {editingCategory ? 'Update' : 'Add'} Category
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