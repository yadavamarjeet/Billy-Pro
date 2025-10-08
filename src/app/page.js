'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout/Layout';
import StatsCards from '@/components/Dashboard/StatsCards';
import SalesChart from '@/components/Dashboard/SalesChart';
import ProductsChart from '@/components/Dashboard/ProductsChart';
import RecentInvoices from '@/components/Dashboard/RecentInvoices';
import { Storage } from '@/lib/storage';
import { initialData, filterInvoicesByDate, getSalesTrendData, getTopProductsData } from '@/lib/data';

export default function DashboardPage() {
  const [data, setData] = useState(initialData);
  const [timeFilter, setTimeFilter] = useState('month');

  useEffect(() => {
    const savedData = Storage.getData();
    if (savedData) setData(savedData);
  }, []);

  const filteredInvoices = filterInvoicesByDate(data.invoices, timeFilter);
  const salesData = getSalesTrendData(filteredInvoices);
  const productsData = getTopProductsData(filteredInvoices);

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
          <div className="flex space-x-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        <StatsCards invoices={filteredInvoices} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SalesChart data={salesData} />
          <ProductsChart data={productsData} />
        </div>

        <RecentInvoices invoices={data.invoices} />
      </div>
    </Layout>
  );
}