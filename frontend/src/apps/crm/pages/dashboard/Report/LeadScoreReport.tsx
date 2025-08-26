import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, Award, Calendar, BarChart3 } from 'lucide-react';
import { useLeadScoreDistribution, type LeadScoreStats, type LeadScoreDistribution } from '../../../leads/api';
import { DealDateReport } from './DealDateReport';
import { LoadingSpinner, ErrorAlert } from '@/shared';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const SCORE_RANGES = [
  { label: 'High Score (>50)', color: '#10B981', icon: Award },
  { label: 'Medium Score (30-50)', color: '#F59E0B', icon: TrendingUp },
  { label: 'Low Score (10-30)', color: '#EF4444', icon: Target },
  { label: 'Very Low Score (<10)', color: '#6B7280', icon: Users },
];

export const LeadScoreReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'deals'>('leads');
  const { data: scoreData, isLoading, error } = useLeadScoreDistribution();

  // Lead Score Analytics Component
  const renderLeadAnalytics = () => {
    if (isLoading) {
      return (
        <div className="min-h-96 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="min-h-96 flex items-center justify-center p-4">
          <ErrorAlert 
            title="Failed to load lead score data" 
            message="Unable to fetch lead score distribution. Please try again." 
          />
        </div>
      );
    }

    if (!scoreData) {
      return (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No lead data available</h3>
          </div>
        </div>
      );
    }

    const pieData = [
      { name: 'High Score (>50)', value: scoreData.high_score_leads, percentage: ((scoreData.high_score_leads / scoreData.total_leads) * 100).toFixed(1) },
      { name: 'Medium Score (30-50)', value: scoreData.medium_score_leads, percentage: ((scoreData.medium_score_leads / scoreData.total_leads) * 100).toFixed(1) },
      { name: 'Low Score (10-30)', value: scoreData.low_score_leads, percentage: ((scoreData.low_score_leads / scoreData.total_leads) * 100).toFixed(1) },
      { name: 'Very Low Score (<10)', value: scoreData.very_low_score_leads, percentage: ((scoreData.very_low_score_leads / scoreData.total_leads) * 100).toFixed(1) },
    ];

    const barData = scoreData.distribution?.map(item => ({
      range: item.score_range,
      count: item.count,
      percentage: item.percentage,
    })) || [];

    return (
      <div>
        {/* Lead Score Analysis Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <TrendingUp className="mr-3 h-7 w-7 text-blue-600" />
            Lead Score Analysis
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Visual representation of lead scoring distribution across different ranges
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {SCORE_RANGES.map((range, index) => {
            const IconComponent = range.icon;
            const values = [
              scoreData.high_score_leads,
              scoreData.medium_score_leads,
              scoreData.low_score_leads,
              scoreData.very_low_score_leads,
            ];
            const value = values[index];
            const percentage = ((value / scoreData.total_leads) * 100).toFixed(1);

            return (
              <div key={range.label} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: range.color + '20' }}
                    >
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: range.color }}
                      />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        {range.label}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {value}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {percentage}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Lead Score Distribution
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${percentage}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `${value} leads (${pieData.find(d => d.name === name)?.percentage}%)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Lead Count by Score Range
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `${value} leads`,
                      'Count'
                    ]}
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
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{scoreData.total_leads}</div>
              <div className="text-gray-600 dark:text-gray-400">Total Leads</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {scoreData.avg_score ? scoreData.avg_score.toFixed(1) : 'N/A'}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {((scoreData.high_score_leads / scoreData.total_leads) * 100).toFixed(1)}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">High Quality Leads</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <BarChart3 className="mr-3 h-8 w-8 text-blue-600" />
            CRM Reports & Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive visual analysis of your CRM data including leads and deals
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('leads')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leads'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Lead Score Analysis
                </div>
              </button>
              <button
                onClick={() => setActiveTab('deals')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'deals'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Deal Date Analytics
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'deals' ? (
          <DealDateReport />
        ) : (
          renderLeadAnalytics()
        )}
      </div>
    </div>
  );
};