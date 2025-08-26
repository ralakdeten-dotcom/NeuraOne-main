import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { DollarSign, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { useDealDateAnalytics, type DealDateAnalytics } from '../../../deals/api';
import { LoadingSpinner, ErrorAlert } from '@/shared';

const STAGE_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
];

export const DealDateReport: React.FC = () => {
  const { data: dealData, isLoading, error } = useDealDateAnalytics();

  // Debug logging
  console.log('DealDateReport - Loading:', isLoading, 'Error:', error, 'Data:', dealData);

  // Test: Return simple div first to see if component renders
  // return <div className="p-8 bg-blue-100 text-lg font-bold">Deal Date Report Test - Component is rendering!</div>;

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    console.error('Deal Date Analytics Error:', error);
    return (
      <div className="min-h-96 flex items-center justify-center p-4">
        <div className="text-center">
          <ErrorAlert 
            title="Failed to load deal analytics" 
            message={`Unable to fetch deal date analytics: ${error.message || 'Unknown error'}`} 
          />
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Check console for details. You might need to restart the backend server.
          </div>
        </div>
      </div>
    );
  }

  if (!dealData || dealData.total_deals === 0) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No deal data available</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create some deals to see analytics</p>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total values for summary cards
  const totalValue = dealData.total_value_by_month.reduce((sum, item) => sum + item.value, 0);
  const avgDealValue = totalValue / dealData.total_deals;
  const highestMonth = dealData.deals_by_month.reduce((max, item) => 
    item.count > (max?.count || 0) ? item : max, dealData.deals_by_month[0]
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <Calendar className="mr-3 h-7 w-7 text-indigo-600" />
          Deal Date Analytics
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Visual analysis of deal creation and closing patterns by date and month
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Deals
                </dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {dealData.total_deals}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Value
                </dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalValue)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Avg Deal Value
                </dt>
                <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(avgDealValue)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Best Month
                </dt>
                <dd className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {highestMonth?.month || 'N/A'}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deals Count by Month - Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Deals Count by Month
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealData.deals_by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value} deals`, 'Deals Count']}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Value by Month - Area Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Total Value by Month
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dealData.total_value_by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Total Value']}
                />
                <Area 
                  type="monotone"
                  dataKey="value" 
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Deal Value by Month - Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Average Deal Value by Month
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dealData.avg_deal_value_by_month}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Avg Value']}
                />
                <Line 
                  type="monotone"
                  dataKey="avg_value" 
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deals by Stage Monthly - Stacked Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Deals by Stage (Monthly)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealData.deals_by_stage_monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                {dealData.available_stages.map((stage, index) => (
                  <Bar 
                    key={stage}
                    dataKey={stage} 
                    stackId="stages"
                    fill={STAGE_COLORS[index % STAGE_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4">
            {dealData.available_stages.map((stage, index) => (
              <div key={stage} className="flex items-center text-sm">
                <div 
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: STAGE_COLORS[index % STAGE_COLORS.length] }}
                />
                <span className="text-gray-600 dark:text-gray-400">{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Summary Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{dealData.months_count}</div>
            <div className="text-gray-600 dark:text-gray-400">Active Months</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{dealData.available_stages.length}</div>
            <div className="text-gray-600 dark:text-gray-400">Deal Stages</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{dealData.current_year}</div>
            <div className="text-gray-600 dark:text-gray-400">Current Year</div>
          </div>
        </div>
      </div>
    </div>
  );
};