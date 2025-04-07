
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { DateRangeType } from './DateSelector';

interface UsagePatternProps {
  dateRange: DateRangeType;
  startDate?: Date;
  endDate?: Date;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

const UsagePattern = ({ dateRange, startDate, endDate }: UsagePatternProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([
    { name: 'Solar', value: 0, color: '#27ae60' },
    { name: 'Grid', value: 0, color: '#e74c3c' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true);
        let query = supabase.from('spdu_readings')
          .select('source1_kwh, source2_kwh, timestamp');

        // Apply date filtering based on the selected range
        switch (dateRange) {
          case 'day':
            query = query.gte('timestamp', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = query.gte('timestamp', weekAgo.toISOString());
            break;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = query.gte('timestamp', monthAgo.toISOString());
            break;
          case 'custom':
            if (startDate) {
              query = query.gte('timestamp', startDate.toISOString());
            }
            if (endDate) {
              query = query.lte('timestamp', endDate.toISOString());
            }
            break;
          case 'lifetime':
            // No date filtering for lifetime
            break;
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Calculate totals
          const totals = data.reduce(
            (acc, reading) => {
              acc.solar += Number(reading.source2_kwh || 0);
              acc.grid += Number(reading.source1_kwh || 0);
              return acc;
            },
            { solar: 0, grid: 0 }
          );

          // Update chart data
          setChartData([
            { name: 'Solar', value: parseFloat(totals.solar.toFixed(2)), color: '#27ae60' },
            { name: 'Grid', value: parseFloat(totals.grid.toFixed(2)), color: '#e74c3c' },
          ]);
        } else {
          // No data, reset chart
          setChartData([
            { name: 'Solar', value: 0, color: '#27ae60' },
            { name: 'Grid', value: 0, color: '#e74c3c' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching usage data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load usage data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [dateRange, startDate, endDate]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value} kWh`}</p>
          <p className="text-sm text-gray-600">{`${Math.round((payload[0].value / (chartData[0].value + chartData[1].value)) * 100)}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const isDataAvailable = totalValue > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-card h-full">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Global Solar/Grid Usage Pattern</h3>
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : isDataAvailable ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex justify-center items-center h-[300px] text-gray-500">
          No data available for the selected period
        </div>
      )}
    </div>
  );
};

export default UsagePattern;
