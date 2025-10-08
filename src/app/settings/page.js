'use client';

import { useState, useEffect } from 'react';
import { Save, Download, Upload, Trash2 } from 'lucide-react';
import { Storage } from '@/lib/storage';
import { initialData } from '@/lib/data';
import Toast from '@/components/UI/Toast';
import Layout from '@/components/Layout/Layout';

export default function Settings() {
    const [data, setData] = useState(initialData);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        const savedData = Storage.getData();
        if (savedData) setData(savedData);
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const updateSettings = (field, value) => {
        setData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [field]: value
            }
        }));
    };

    const saveSettings = () => {
        Storage.saveData(data);
        showToast('Settings saved successfully');
    };

    const exportData = async () => {
        const exportData = await Storage.exportData();
        if (exportData) {
            const a = document.createElement('a');
            a.href = exportData.url;
            a.download = exportData.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(exportData.url);
            showToast('Data exported successfully');
        }
    };

    const importData = async (event) => {
        const file = event.target.files[0];
        if (file) {
            await Storage.importData(file)
                .then((importedData) => {
                    setData(importedData);
                    showToast('Data imported successfully');
                })
                .catch((error) => {
                    showToast(error.message, 'error');
                });
        }
        event.target.value = ''; // Reset file input
    };

    const clearData = async () => {
        if (confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
            await Storage.clearData();
            setData(initialData);
            showToast('All data cleared successfully');
        }
    };

    return (
        <Layout>
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>

                <div className="space-y-6">
                    {/* Business Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Business Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Business Name
                                </label>
                                <input
                                    type="text"
                                    value={data.settings.businessName}
                                    onChange={(e) => updateSettings('businessName', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.settings.businessEmail}
                                    onChange={(e) => updateSettings('businessEmail', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={data.settings.businessPhone}
                                    onChange={(e) => updateSettings('businessPhone', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Address
                                </label>
                                <textarea
                                    value={data.settings.businessAddress}
                                    onChange={(e) => updateSettings('businessAddress', e.target.value)}
                                    rows="2"
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Settings */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Invoice Settings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Invoice Prefix
                                </label>
                                <input
                                    type="text"
                                    value={data.settings.invoicePrefix}
                                    onChange={(e) => updateSettings('invoicePrefix', e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Starting Number
                                </label>
                                <input
                                    type="number"
                                    value={data.settings.invoiceStart}
                                    onChange={(e) => updateSettings('invoiceStart', parseInt(e.target.value))}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                            Data Management
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={exportData}
                                className="btn-secondary flex items-center justify-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Export All Data</span>
                            </button>

                            <label className="btn-primary flex items-center justify-center space-x-2 cursor-pointer">
                                <Upload className="w-4 h-4" />
                                <span>Import Data</span>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={importData}
                                    className="hidden"
                                />
                            </label>

                            <button
                                onClick={clearData}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Clear All Data</span>
                            </button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={saveSettings}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Settings</span>
                        </button>
                    </div>
                </div>

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