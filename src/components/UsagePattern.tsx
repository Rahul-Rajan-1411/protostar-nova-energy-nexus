
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { DateRangeType } from './DateSelector';

interface UsagePatternProps {
  dateRange: DateRangeType;
  startDate?: Date;
  endDate?: Date;
  selectedMonth?: Date;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface EnergyData {
  distributed: number;
  gridConsumed: number;
  [key: string]: any;
}

const UsagePattern = ({ dateRange, startDate, endDate, selectedMonth }: UsagePatternProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([
    { name: 'Solar', value: 0, color: '#27ae60' },
    { name: 'Grid', value: 0, color: '#e74c3c' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true);
        
        // Format date range
        const { formattedStartDate, formattedEndDate } = formatDateRange(dateRange, startDate, endDate, selectedMonth);
        
        // Convert dateRange to uppercase first letter format as required by the Supabase function
        const formattedDateRange = dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
        console.log('Usage Pattern using date range format:', formattedDateRange);
        console.log('Start date:', formattedStartDate);
        console.log('End date:', formattedEndDate);
        
        // Call Supabase to get energy data using the stored function with properly formatted date range
        console.log('Fetching usage pattern data...');
        const { data, error } = await supabase.rpc('get_energy_data', {
          p_date_range: formattedDateRange,
          p_start_date: formattedStartDate,
          p_end_date: formattedEndDate
        });
        
        if (error) {
          console.error('Error fetching usage data:', error);
          throw error;
        }
        
        if (data) {
          console.log('Energy data from RPC:', data);
          
          // Cast data to the expected type for safe property access
          // Using double casting to ensure type safety
          const typedData = data as unknown as EnergyData;
          
          // Update chart data
          const solarValue = Number(typedData.distributed || 0);
          const gridValue = Number(typedData.gridConsumed || 0);
          
          setChartData([
            { name: 'Solar', value: solarValue, color: '#27ae60' },
            { name: 'Grid', value: gridValue, color: '#e74c3c' },
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
  }, [dateRange, startDate, endDate, selectedMonth]);

  // Helper function to format date range
  const formatDateRange = (dateRange: DateRangeType, startDate?: Date, endDate?: Date, selectedMonth?: Date) => {
    let formattedStartDate: string;
    let formattedEndDate: string;

    // Default date during development
    const developmentDate = new Date(2024, 2, 31); // March 31, 2024

    switch (dateRange) {
      case 'day':
        const dayDate = startDate || developmentDate;
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        formattedStartDate = dayStart.toISOString();
        formattedEndDate = dayEnd.toISOString();
        break;
        
      case 'month':
        const monthDate = selectedMonth || new Date(2024, 2, 1); // March 2024
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
        
        formattedStartDate = monthStart.toISOString();
        formattedEndDate = monthEnd.toISOString();
        break;
        
      case 'custom':
        if (startDate) {
          const customStart = new Date(startDate);
          customStart.setHours(0, 0, 0, 0);
          formattedStartDate = customStart.toISOString();
        } else {
          formattedStartDate = new Date(2024, 0, 1).toISOString(); // Default to Jan 1, 2024
        }
        
        if (endDate) {
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          formattedEndDate = customEnd.toISOString();
        } else {
          formattedEndDate = new Date(2024, 11, 31, 23, 59, 59, 999).toISOString(); // Default to Dec 31, 2024
        }
        break;
        
      case 'lifetime':
      default:
        // For lifetime, get all data (use a very old start date)
        formattedStartDate = new Date(2000, 0, 1).toISOString();
        formattedEndDate = new Date(2050, 11, 31, 23, 59, 59, 999).toISOString();
        break;
    }
    
    return { formattedStartDate, formattedEndDate };
  };

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
