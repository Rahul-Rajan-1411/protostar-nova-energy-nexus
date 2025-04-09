
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
        
        // Get SPDU readings for the period
        const startQuery = supabase
          .from('spdu_readings')
          .select('spdu_id, source1_kwh, source2_kwh, timestamp')
          .gte('timestamp', formattedStartDate)
          .order('timestamp', { ascending: true });
          
        const endQuery = supabase
          .from('spdu_readings')
          .select('spdu_id, source1_kwh, source2_kwh, timestamp')
          .lte('timestamp', formattedEndDate)
          .order('timestamp', { ascending: false });
        
        const [startResponse, endResponse] = await Promise.all([startQuery, endQuery]);
        
        if (startResponse.error) throw startResponse.error;
        if (endResponse.error) throw endResponse.error;
        
        const startReadings = startResponse.data || [];
        const endReadings = endResponse.data || [];
        
        // Calculate solar and grid consumption
        let solarValue = 0;
        let gridValue = 0;
        
        if (startReadings.length > 0 && endReadings.length > 0) {
          // Group readings by SPDU ID
          const startReadingBySpduId = groupBy(startReadings, 'spdu_id');
          const endReadingBySpduId = groupBy(endReadings, 'spdu_id');
          
          // Get unique SPDU IDs
          const spduIds = [...new Set([
            ...Object.keys(startReadingBySpduId),
            ...Object.keys(endReadingBySpduId)
          ])];
          
          // Calculate difference for each SPDU
          spduIds.forEach(spduId => {
            const start = startReadingBySpduId[spduId]?.[0];
            const end = endReadingBySpduId[spduId]?.[0];
            
            if (start && end) {
              solarValue += (Number(end.source2_kwh) - Number(start.source2_kwh));
              gridValue += (Number(end.source1_kwh) - Number(start.source1_kwh));
            } else if (end && !start) {
              // If we only have end readings, just use those (lifetime case)
              solarValue += Number(end.source2_kwh);
              gridValue += Number(end.source1_kwh);
            }
          });
        } else if (endReadings.length > 0) {
          // If we only have end readings (for lifetime view), sum them up
          solarValue = endReadings.reduce((sum, item) => sum + Number(item.source2_kwh || 0), 0);
          gridValue = endReadings.reduce((sum, item) => sum + Number(item.source1_kwh || 0), 0);
        }
        
        // Update chart data
        setChartData([
          { name: 'Solar', value: parseFloat(solarValue.toFixed(2)), color: '#27ae60' },
          { name: 'Grid', value: parseFloat(gridValue.toFixed(2)), color: '#e74c3c' },
        ]);
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
    const developmentDate = new Date(2023, 2, 31); // March 31, 2023

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
        const monthDate = selectedMonth || new Date(2023, 2, 1); // March 2023
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
          formattedStartDate = new Date(2023, 0, 1).toISOString(); // Default to Jan 1, 2023
        }
        
        if (endDate) {
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          formattedEndDate = customEnd.toISOString();
        } else {
          formattedEndDate = new Date(2023, 11, 31, 23, 59, 59, 999).toISOString(); // Default to Dec 31, 2023
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

  // Helper function to group array by key
  const groupBy = <T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      result[groupKey] = result[groupKey] || [];
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
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
