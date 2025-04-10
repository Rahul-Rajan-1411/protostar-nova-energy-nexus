
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { DateRangeType } from './DateSelector';

interface UsageDetailRowProps {
  label: string;
  value: string;
  color: string;
  indent?: boolean;
  bold?: boolean;
}

interface UsageDetailsProps {
  dateRange: DateRangeType;
  startDate?: Date;
  endDate?: Date;
  selectedMonth?: Date;
}

interface UsageData {
  solarGenerated: number;
  solarConsumed: number;
  solarDistributed: number;
  solarCommonUtilities: number;
  solarUnused: number;
  gridConsumed: number;
}

interface EnergyData {
  generated: number;
  consumed: number;
  distributed: number;
  commonUtilities: number;
  unused: number;
  gridConsumed: number;
  [key: string]: any;
}

const UsageDetailRow = ({ label, value, color, indent = false, bold = false }: UsageDetailRowProps) => {
  return (
    <div className={`flex items-center justify-between mb-5 ${indent ? 'ml-6' : ''}`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
        <span className={`text-gray-700 ${bold ? 'font-bold' : ''}`}>{label}</span>
      </div>
      <div className={`${bold ? 'font-bold' : 'font-semibold'}`}>{value}</div>
    </div>
  );
};

const UsageDetails = ({ dateRange, startDate, endDate, selectedMonth }: UsageDetailsProps) => {
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData>({
    solarGenerated: 0,
    solarConsumed: 0,
    solarDistributed: 0,
    solarCommonUtilities: 0,
    solarUnused: 0,
    gridConsumed: 0
  });

  useEffect(() => {
    const fetchUsageDetails = async () => {
      try {
        setLoading(true);
        
        // Format date range for query
        const { formattedStartDate, formattedEndDate } = formatDateRange(dateRange, startDate, endDate, selectedMonth);
        
        // Call Supabase to get energy data using the stored function
        const { data, error } = await supabase.rpc('get_energy_data', {
          p_date_range: dateRange,
          p_start_date: formattedStartDate,
          p_end_date: formattedEndDate
        }) as { data: EnergyData | null, error: any };
        
        if (error) throw error;
        
        if (data) {
          console.log('Energy data from RPC:', data);
          
          // Set the usage data from the response
          setUsageData({
            solarGenerated: Number(data.generated) || 0,
            solarConsumed: Number(data.consumed) || 0,
            solarDistributed: Number(data.distributed) || 0,
            solarCommonUtilities: Number(data.commonUtilities) || 0,
            solarUnused: Number(data.unused) || 0,
            gridConsumed: Number(data.gridConsumed) || 0
          });
        }
      } catch (error) {
        console.error('Error fetching usage details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load usage details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsageDetails();
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-card h-full">
      <h3 className="text-lg font-medium text-gray-700 mb-6">Global Solar/Grid Usage Details</h3>
      
      {loading ? (
        <div className="flex justify-center items-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-2">
          <UsageDetailRow 
            label="Solar Power: Generated" 
            value={`${usageData.solarGenerated.toFixed(2)} MWh`} 
            color="bg-green-600"
            bold={true}
          />
          
          <UsageDetailRow 
            label="Solar Power: Consumed" 
            value={`${usageData.solarConsumed.toFixed(2)} MWh`} 
            color="bg-green-600" 
            indent={true}
          />
          
          <UsageDetailRow 
            label="Solar Power: Distributed" 
            value={`${usageData.solarDistributed.toFixed(2)} MWh`} 
            color="bg-green-500" 
            indent={true}
          />
          
          <UsageDetailRow 
            label="Solar Power: Common Utilities" 
            value={`${usageData.solarCommonUtilities.toFixed(2)} MWh`} 
            color="bg-yellow-500" 
            indent={true}
          />
          
          <UsageDetailRow 
            label="Solar Power: Unused" 
            value={`${usageData.solarUnused.toFixed(2)} MWh`} 
            color="bg-orange-500" 
            indent={true}
          />
          
          <UsageDetailRow 
            label="Grid Power: Consumed" 
            value={`${usageData.gridConsumed.toFixed(2)} MWh`} 
            color="bg-red-500" 
            bold={true}
          />
        </div>
      )}
    </div>
  );
};

export default UsageDetails;
