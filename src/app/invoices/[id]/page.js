'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Share2, Plus, Trash2, ArrowLeft, Search } from 'lucide-react';
import { Storage } from '@/lib/storage';
import { WhatsAppService } from '@/lib/whatsapp';
import {
    generateId,
    initialData,
    calculateInvoiceTotals,
    generateInvoiceNumber,
    formatDate
} from '@/lib/data';
import Layout from '@/components/Layout/Layout';
import Toast from '@/components/UI/Toast';

export default function CreateEditInvoice() {
    const router = useRouter();
    const params = useParams();
    const isEditMode = params.id !== 'create';

    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('flat'); // 'flat' or 'percentage'
    const [data, setData] = useState(initialData);
    const [currentInvoice, setCurrentInvoice] = useState({
        id: '',
        number: '',
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        customerPhone: '',
        items: [],
        subtotal: 0,
        total: 0,
    });

    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [customPrice, setCustomPrice] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [originalItems, setOriginalItems] = useState([]);

    useEffect(() => {
        (async () => {
            const savedData = await Storage.getData();
            if (savedData) {
                setData(savedData);

                if (isEditMode) {
                    // Edit mode - load existing invoice
                    const existingInvoice = savedData.invoices.find(inv => inv.id === params.id);
                    if (existingInvoice) {
                        setCurrentInvoice(existingInvoice);
                        setOriginalItems([...existingInvoice.items]);

                        // Load discount data if it exists
                        if (existingInvoice.discount) {
                            setDiscount(existingInvoice.discount);
                            // You might want to store discount type in your invoice data
                            // or default to flat amount
                            setDiscountType('flat');
                        }
                    } else {
                        showToast('Invoice not found', 'error');
                        router.push('/invoices');
                    }
                } else {
                    // Create mode - generate new invoice number
                    setCurrentInvoice(prev => ({
                        ...prev,
                        number: generateInvoiceNumber(savedData.invoices, savedData.settings)
                    }));
                }
            }
        })();
    }, [isEditMode, params.id, router]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const { subtotal, discount: discountAmount, total } = calculateInvoiceTotals(currentInvoice.items,
        discount,
        discountType);

    // Update stock when items are added/removed
    const updateProductStock = (productName, quantityChange, isRemoving = false) => {
        const product = data.products.find(p => p.name === productName);
        if (product && product.stock !== undefined) {
            const updatedProducts = data.products.map(p =>
                p.id === product.id
                    ? { ...p, stock: isRemoving ? p.stock + quantityChange : Math.max(0, p.stock - quantityChange) }
                    : p
            );
            setData(prev => ({ ...prev, products: updatedProducts }));
        }
    };

    const addProduct = () => {
        if (!selectedProduct && !customPrice) {
            showToast('Please select a product or enter a custom price', 'error');
            return;
        }

        let productName = selectedProduct.trim();
        let productPrice = parseFloat(customPrice) || 0;

        // If product name matches an existing product, use its price and check stock
        const existingProduct = data.products.find(p =>
            p.name.toLowerCase() === productName.toLowerCase()
        );

        if (existingProduct) {
            if (customPrice === existingProduct.price) {
                productPrice = existingProduct.price;
            }

            // Check stock availability
            if (existingProduct.stock !== undefined && existingProduct.stock < quantity) {
                showToast(`Only ${existingProduct.stock} items available in stock`, 'error');
                return;
            }

        } else if (productPrice <= 0) {
            showToast('Please enter a valid price', 'error');
            return;
        }

        const qty = parseInt(quantity) || 1;
        const itemTotal = productPrice * qty;

        const newItem = {
            id: generateId(),
            name: productName,
            price: productPrice,
            quantity: qty,
            total: itemTotal,
            productId: existingProduct?.id // Store product ID for stock management
        };

        setCurrentInvoice(prev => ({
            ...prev,
            items: [...prev.items, newItem]
        }));

        // Update stock for existing products
        if (existingProduct) {
            updateProductStock(productName, qty);
        }

        // Reset form
        setSelectedProduct('');
        setQuantity(1);
        setCustomPrice('');
    };

    const removeItem = (itemId) => {
        const itemToRemove = currentInvoice.items.find(item => item.id === itemId);

        setCurrentInvoice(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== itemId)
        }));

        // Restore stock if it's an existing product
        if (itemToRemove?.productId) {
            updateProductStock(itemToRemove.name, itemToRemove.quantity, true);
        }
    };

    // Update customer total spent
    const updateCustomerData = (customerName, customerPhone, amount, isEdit = false, oldAmount = 0, existingCustomerId = null) => {
        const updatedCustomers = [...data.customers];
        let customerId = existingCustomerId;

        // Case 1: Walk-in customer (no name and no phone)
        if (!customerName && !customerPhone) {
            return { customerId: null, updatedCustomers };
        }

        // Case 2: Only name provided (create/update customer with name only)
        if (customerName && !customerPhone) {
            let customer = updatedCustomers.find(c =>
                c.name === customerName && (!c.phone || c.phone === '')
            );

            if (customer) {
                // Update existing customer with same name and no phone
                customer.totalSpent = isEdit
                    ? (customer.totalSpent - oldAmount) + amount
                    : customer.totalSpent + amount;
                customerId = customer.id;
            } else {
                // Create new customer with name only
                customerId = generateId();
                updatedCustomers.push({
                    id: customerId,
                    name: customerName,
                    phone: '',
                    email: '',
                    address: '',
                    totalSpent: amount,
                    createdAt: new Date().toISOString()
                });
            }
        }
        // Case 3: Phone provided (name is mandatory when phone is provided)
        else if (customerPhone && customerName) {
            let customer = updatedCustomers.find(c => c.phone === customerPhone);

            if (customer) {
                // Update existing customer with same phone
                customer.name = customerName; // Update name if changed
                customer.totalSpent = isEdit
                    ? (customer.totalSpent - oldAmount) + amount
                    : customer.totalSpent + amount;
                customerId = customer.id;
            } else {
                // Check if customer exists with same name but no phone
                const customerWithSameName = updatedCustomers.find(c =>
                    c.name === customerName && (!c.phone || c.phone === '')
                );

                if (customerWithSameName) {
                    // Update existing customer - add phone to existing customer
                    customerWithSameName.phone = customerPhone;
                    customerWithSameName.totalSpent = isEdit
                        ? (customerWithSameName.totalSpent - oldAmount) + amount
                        : customerWithSameName.totalSpent + amount;
                    customerId = customerWithSameName.id;
                } else {
                    // Create completely new customer
                    customerId = generateId();
                    updatedCustomers.push({
                        id: customerId,
                        name: customerName,
                        phone: customerPhone,
                        email: '',
                        address: '',
                        totalSpent: amount,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }

        return { customerId, updatedCustomers };
    };

    // Restore stock from original items when editing
    const restoreOriginalStock = () => {
        originalItems.forEach(item => {
            if (item.productId) {
                updateProductStock(item.name, item.quantity, true);
            }
        });
    };

    const saveInvoice = async () => {
        // Validations
        if (currentInvoice.items.length === 0) {
            showToast('Please add at least one item to the invoice', 'error');
            return;
        }

        if (!currentInvoice.number.trim()) {
            showToast('Please enter invoice number', 'error');
            return;
        }

        // Check for duplicate invoice number (excluding current invoice in edit mode)
        const duplicate = data.invoices.find(inv =>
            inv.number === currentInvoice.number && inv.id !== currentInvoice.id
        );

        if (duplicate) {
            showToast('Invoice number already exists. Please use a different number.', 'error');
            return;
        }

        // Validate date
        if (isNaN(new Date(currentInvoice.date).getTime())) {
            showToast('Please enter a valid date', 'error');
            return;
        }

        // Validate customer data
        const customerName = currentInvoice.customerName.trim() || 'Walk-in Customer';
        const customerPhone = currentInvoice.customerPhone?.trim() || '';

        // If phone is provided, name is mandatory
        if (customerPhone && !customerName) {
            showToast('Customer name is required when phone number is provided', 'error');
            return;
        }

        // Handle customer data
        let customerId = currentInvoice.customerId || null;
        let oldTotal = 0;

        if (isEditMode) {
            const originalInvoice = data.invoices.find(inv => inv.id === currentInvoice.id);
            oldTotal = originalInvoice ? originalInvoice.total : 0;
            restoreOriginalStock();
        }

        // Update or create customer
        const customerUpdateResult = updateCustomerData(
            customerName,
            customerPhone,
            total,
            isEditMode,
            oldTotal,
            customerId
        );

        customerId = customerUpdateResult.customerId;

        // Format date and time
        const now = new Date();
        const formattedDateTime = now.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).replace(/\//g, '-');

        // Create invoice object
        const invoiceToSave = {
            ...currentInvoice,
            id: isEditMode ? currentInvoice.id : generateId(),
            customerId,
            customerName,
            customerPhone,
            subtotal,
            discount: discountAmount,
            total,
            createdAt: isEditMode ? currentInvoice.createdAt : formattedDateTime,
            updatedAt: isEditMode ? formattedDateTime : undefined
        };

        // Update invoices
        let updatedInvoices;
        if (isEditMode) {
            updatedInvoices = data.invoices.map(inv =>
                inv.id === currentInvoice.id ? invoiceToSave : inv
            );
        } else {
            updatedInvoices = [...data.invoices, invoiceToSave];
        }

        // SINGLE SAVE - Combine customer updates and invoice updates
        const updatedData = {
            ...data,
            customers: customerUpdateResult.updatedCustomers,
            invoices: updatedInvoices
        };

        setData(updatedData);
        await Storage.saveData(updatedData);

        showToast(`Invoice ${isEditMode ? 'updated' : 'saved'} successfully!`);

        if (!isEditMode) {
            // Reset form for new invoice
            setCurrentInvoice({
                id: '',
                number: generateInvoiceNumber(updatedInvoices, data.settings),
                date: new Date().toISOString().split('T')[0],
                customerName: '',
                customerPhone: '',
                items: [],
                subtotal: 0,
                total: 0,
            });
            setDiscount(0);
            setDiscountType('flat');
        }

        router.push('/invoices');
    };

    const shareWhatsApp = async () => {
        if (!currentInvoice.customerPhone) {
            showToast('Customer phone number is required for WhatsApp sharing', 'error');
            return;
        }

        if (currentInvoice.items.length === 0) {
            showToast('Please add items to the invoice before sharing', 'error');
            return;
        }


        try {
            // Save invoice first
            await saveInvoice();

            // Get the updated invoice data
            const savedData = await Storage.getData();
            const updatedInvoice = savedData.invoices.find(inv =>
                isEditMode ? inv.id === currentInvoice.id : inv.number === currentInvoice.number
            );

            if (updatedInvoice) {
                const whatsappUrl = WhatsAppService.shareInvoice(updatedInvoice, data);
                window.open(whatsappUrl, '_blank');
                showToast('Opening WhatsApp...');
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    if (!data) return <div>Loading...</div>;

    return (
        <Layout>
            <div className="container mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/invoices')}
                            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Back to Invoices</span>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}
                        </h1>
                        {isEditMode && (
                            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                                Editing: {currentInvoice.number}
                            </span>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={saveInvoice}
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isEditMode ? 'Update' : 'Save'} Invoice</span>
                        </button>
                        <button
                            onClick={shareWhatsApp}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>WhatsApp</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Left Column - Customer Info & Products */}
                    <div className="space-y-6">
                        {/* Customer Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Customer Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Customer Name
                                    </label>
                                    <input
                                        type="text"
                                        value={currentInvoice.customerName}
                                        onChange={(e) => setCurrentInvoice(prev => ({ ...prev, customerName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Enter customer name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={currentInvoice.customerPhone}
                                        onChange={(e) => setCurrentInvoice(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Enter phone number for WhatsApp"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Invoice Date
                                    </label>
                                    <input
                                        type="date"
                                        value={currentInvoice.date}
                                        onChange={(e) => setCurrentInvoice(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        value={currentInvoice.number}
                                        onChange={(e) => setCurrentInvoice(prev => ({ ...prev, number: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="e.g., INV-001"
                                        disabled={isEditMode} // Always disabled in edit mode
                                    />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Discount Type
                                    </label>
                                    <select
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="flat">Flat Amount (₹)</option>
                                        <option value="percentage">Percentage (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Discount {discountType === 'percentage' ? '(%)' : '(₹)'}
                                    </label>
                                    <input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step={discountType === 'percentage' ? '1' : '0.01'}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder={discountType === 'percentage' ? '0' : '0.00'}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Add Products */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Add Products & Services
                            </h2>

                            {/* Product Selection Form */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Search & Add Product
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={selectedProduct}
                                            onChange={(e) => {
                                                setSelectedProduct(e.target.value);
                                                // Auto-select if exact match found
                                                const exactMatch = data.products.find(p =>
                                                    p.name.toLowerCase() === e.target.value.toLowerCase()
                                                );
                                                if (exactMatch) {
                                                    setCustomPrice(exactMatch.price.toString());
                                                }
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    addProduct();
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                            placeholder="Type product name or add custom item"
                                        />

                                        {/* Enhanced Custom Dropdown */}
                                        {selectedProduct && (
                                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                                                {data.products
                                                    .filter(product =>
                                                        product.name.toLowerCase().includes(selectedProduct.toLowerCase()) ||
                                                        (product.category && product.category.toLowerCase().includes(selectedProduct.toLowerCase())) ||
                                                        (product.description && product.description.toLowerCase().includes(selectedProduct.toLowerCase()))
                                                    )
                                                    .slice(0, 8)
                                                    .map((product, index) => (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => {
                                                                setSelectedProduct(product.name);
                                                                setCustomPrice(product.price.toString());
                                                            }}
                                                            className={`flex items-center justify-between p-3 cursor-pointer transition-all duration-200 hover:bg-primary/5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${index === 0 ? 'rounded-t-lg' : ''
                                                                } ${index === 7 ? 'rounded-b-lg' : ''}`}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate mr-2">
                                                                        {product.name}
                                                                    </span>
                                                                    <span className="text-sm font-bold text-primary whitespace-nowrap">
                                                                        ₹{product.price.toFixed(2)}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                                                    {product.category && (
                                                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                                                                            {product.category}
                                                                        </span>
                                                                    )}

                                                                    {product.stock !== undefined && (
                                                                        <span className={`px-2 py-1 rounded-full ${product.stock > 10
                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                                            : product.stock > 0
                                                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                                            }`}>
                                                                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {product.description && (
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                                                                        {product.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="ml-3 flex-shrink-0">
                                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                                    <Plus className="w-4 h-4 text-primary" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                }

                                                {/* Add Custom Item Option */}
                                                {data.products.filter(p =>
                                                    p.name.toLowerCase().includes(selectedProduct.toLowerCase())
                                                ).length === 0 && selectedProduct.trim() && (
                                                        <div
                                                            onClick={() => {
                                                                // Keep the current search term as custom item
                                                                setCustomPrice('');
                                                            }}
                                                            className="flex items-center justify-between p-3 cursor-pointer bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-b-lg border-t border-blue-200 dark:border-blue-800"
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                                                        Add "{selectedProduct}" as custom item
                                                                    </span>
                                                                    <span className="text-sm text-blue-600 dark:text-blue-400">
                                                                        Enter price
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                                                    This will create a custom product not in your catalog
                                                                </p>
                                                            </div>
                                                            <div className="ml-3 flex-shrink-0">
                                                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                                                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                {/* No Results */}
                                                {data.products.filter(p =>
                                                    p.name.toLowerCase().includes(selectedProduct.toLowerCase()) ||
                                                    p.category?.toLowerCase().includes(selectedProduct.toLowerCase())
                                                ).length === 0 && !selectedProduct.trim() && (
                                                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                            <p className="text-sm">Start typing to search products</p>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Qty
                                    </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        min="1"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                        placeholder="Qty"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Price (₹)
                                    </label>
                                    <input
                                        type="number"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                                        placeholder="Custom price"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={addProduct}
                                        className="w-full bg-primary text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-1 hover:bg-primary/90 text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Add</span>
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Qty
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {currentInvoice.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    {item.name}
                                                    {item.productId && (
                                                        <span className="text-xs text-green-600 ml-2">• In Catalog</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    ₹{item.price.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                                                    ₹{item.total.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <button
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {currentInvoice.items.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    No items added yet. Start by adding products above.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Invoice Preview */}
                    <div className="sticky top-6 h-fit">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Invoice Preview
                            </h2>

                            {/* Live Preview */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <div className="text-center mb-6">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                        {data.settings?.businessName || 'Your Business Name'}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {data.settings?.businessAddress || 'Business Address'}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {data.settings?.businessPhone || 'Phone'} • {data.settings?.businessEmail || 'Email'}
                                    </p>
                                </div>

                                <div className="flex justify-between mb-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-800 dark:text-white">INVOICE</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            No: {currentInvoice.number || 'INV-001'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Date: {formatDate(currentInvoice.date)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <h4 className="font-semibold text-gray-800 dark:text-white">BILL TO</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {currentInvoice.customerName || 'Customer Name'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {currentInvoice.customerPhone || 'Phone Number'}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Preview */}
                                <div className="mb-6">
                                    <div className="border-b border-gray-300 dark:border-gray-600 pb-2 mb-2">
                                        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <div className="col-span-6">Item</div>
                                            <div className="col-span-2 text-right">Price</div>
                                            <div className="col-span-2 text-right">Qty</div>
                                            <div className="col-span-2 text-right">Total</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {currentInvoice.items.map((item) => (
                                            <div key={item.id} className="grid grid-cols-12 gap-2 text-sm">
                                                <div className="col-span-6 text-gray-800 dark:text-white truncate">
                                                    {item.name}
                                                </div>
                                                <div className="col-span-2 text-right text-gray-600 dark:text-gray-400">
                                                    ₹{item.price.toFixed(2)}
                                                </div>
                                                <div className="col-span-2 text-right text-gray-600 dark:text-gray-400">
                                                    {item.quantity}
                                                </div>
                                                <div className="col-span-2 text-right text-gray-800 dark:text-white font-medium">
                                                    ₹{item.total.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                        {currentInvoice.items.length === 0 && (
                                            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                                No items added
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Totals Preview */}
                                <div className="border-t border-gray-300 dark:border-gray-600 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                        <span className="text-gray-800 dark:text-white">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>Discount:</span>
                                            <span>-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
                                        <span className="text-gray-800 dark:text-white">Total:</span>
                                        <span className="text-primary">₹{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                                    <p>Thank you for your business!</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={saveInvoice}
                                        className="bg-secondary text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-secondary/90 font-medium"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{isEditMode ? 'Update' : 'Save'} Invoice</span>
                                    </button>
                                    <button
                                        onClick={shareWhatsApp}
                                        className="bg-green-500 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-600 font-medium"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span>Share</span>
                                    </button>
                                </div>

                                {/* Quick Stats */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-blue-700 dark:text-blue-300">Items:</span>
                                        <span className="font-medium text-blue-800 dark:text-blue-200">{currentInvoice.items.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="text-blue-700 dark:text-blue-300">Total Amount:</span>
                                        <span className="font-bold text-blue-800 dark:text-blue-200">₹{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
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