
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
        
        // Format date range for queries
        const { formattedStartDate, formattedEndDate } = formatDateRange(dateRange, startDate, endDate, selectedMonth);
        
        // 1. First, get the solar generation meter IDs
        const { data: solarMeters, error: metersError } = await supabase
          .from('building_meters')
          .select('id, meter_type');
        
        if (metersError) throw metersError;
        
        // Filter meter IDs by type
        const solarMeterIds = solarMeters?.filter(meter => meter.meter_type === 'solar_generation').map(meter => meter.id) || [];
        const commonMeterIds = solarMeters?.filter(meter => meter.meter_type === 'common_utilities').map(meter => meter.id) || [];
        
        // 2. Get earliest and latest readings for solar generation
        const solarStartQuery = supabase
          .from('building_meter_readings')
          .select('building_meter_id, reading, timestamp')
          .in('building_meter_id', solarMeterIds)
          .gte('timestamp', formattedStartDate)
          .order('timestamp', { ascending: true });
          
        const solarEndQuery = supabase
          .from('building_meter_readings')
          .select('building_meter_id, reading, timestamp')
          .in('building_meter_id', solarMeterIds)
          .lte('timestamp', formattedEndDate)
          .order('timestamp', { ascending: false });
          
        // 3. Get earliest and latest readings for common utilities
        const commonStartQuery = supabase
          .from('building_meter_readings')
          .select('building_meter_id, reading, timestamp')
          .in('building_meter_id', commonMeterIds)
          .gte('timestamp', formattedStartDate)
          .order('timestamp', { ascending: true });
          
        const commonEndQuery = supabase
          .from('building_meter_readings')
          .select('building_meter_id, reading, timestamp')
          .in('building_meter_id', commonMeterIds)
          .lte('timestamp', formattedEndDate)
          .order('timestamp', { ascending: false });
          
        // 4. Get SPDU readings for the same period
        const spduStartQuery = supabase
          .from('spdu_readings')
          .select('spdu_id, source1_kwh, source2_kwh, timestamp')
          .gte('timestamp', formattedStartDate)
          .order('timestamp', { ascending: true });
          
        const spduEndQuery = supabase
          .from('spdu_readings')
          .select('spdu_id, source1_kwh, source2_kwh, timestamp')
          .lte('timestamp', formattedEndDate)
          .order('timestamp', { ascending: false });
        
        // Execute all queries in parallel
        const [
          solarStartResponse, 
          solarEndResponse, 
          commonStartResponse, 
          commonEndResponse, 
          spduStartResponse, 
          spduEndResponse
        ] = await Promise.all([
          solarStartQuery, 
          solarEndQuery, 
          commonStartQuery, 
          commonEndQuery, 
          spduStartQuery, 
          spduEndQuery
        ]);
        
        // Handle any errors
        if (solarStartResponse.error) throw solarStartResponse.error;
        if (solarEndResponse.error) throw solarEndResponse.error;
        if (commonStartResponse.error) throw commonStartResponse.error;
        if (commonEndResponse.error) throw commonEndResponse.error;
        if (spduStartResponse.error) throw spduStartResponse.error;
        if (spduEndResponse.error) throw spduEndResponse.error;
        
        // Calculate solar generation
        let solarGeneration = 0;
        if (solarStartResponse.data && solarEndResponse.data) {
          // Group readings by meter ID
          const startReadingByMeterId = groupBy(solarStartResponse.data, 'building_meter_id');
          const endReadingByMeterId = groupBy(solarEndResponse.data, 'building_meter_id');
          
          // Calculate the difference for each meter
          solarMeterIds.forEach(meterId => {
            const start = startReadingByMeterId[meterId]?.[0];
            const end = endReadingByMeterId[meterId]?.[0];
            
            if (start && end) {
              solarGeneration += (Number(end.reading) - Number(start.reading));
            } else if (end && !start) {
              // If we only have end readings, just use those (lifetime case)
              solarGeneration += Number(end.reading);
            }
          });
        }
        
        // Calculate common utilities usage
        let commonUtilitiesUsage = 0;
        if (commonStartResponse.data && commonEndResponse.data) {
          // Group readings by meter ID
          const startReadingByMeterId = groupBy(commonStartResponse.data, 'building_meter_id');
          const endReadingByMeterId = groupBy(commonEndResponse.data, 'building_meter_id');
          
          // Calculate the difference for each meter
          commonMeterIds.forEach(meterId => {
            const start = startReadingByMeterId[meterId]?.[0];
            const end = endReadingByMeterId[meterId]?.[0];
            
            if (start && end) {
              commonUtilitiesUsage += (Number(end.reading) - Number(start.reading));
            } else if (end && !start) {
              // If we only have end readings, just use those (lifetime case)
              commonUtilitiesUsage += Number(end.reading);
            }
          });
        }
        
        // Calculate SPDU usage (solar and grid)
        let solarDistributed = 0;
        let gridConsumed = 0;
        
        if (spduStartResponse.data && spduEndResponse.data) {
          // Group readings by SPDU ID
          const startReadingBySpduId = groupBy(spduStartResponse.data, 'spdu_id');
          const endReadingBySpduId = groupBy(spduEndResponse.data, 'spdu_id');
          
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
              solarDistributed += (Number(end.source2_kwh) - Number(start.source2_kwh));
              gridConsumed += (Number(end.source1_kwh) - Number(start.source1_kwh));
            } else if (end && !start) {
              // If we only have end readings, just use those (lifetime case)
              solarDistributed += Number(end.source2_kwh);
              gridConsumed += Number(end.source1_kwh);
            }
          });
        }
        
        // Convert to MWh
        solarGeneration = solarGeneration / 1000;
        commonUtilitiesUsage = commonUtilitiesUsage / 1000;
        solarDistributed = solarDistributed / 1000;
        gridConsumed = gridConsumed / 1000;
        
        // Calculate solar consumed (distributed + common utilities)
        const solarConsumed = solarDistributed + commonUtilitiesUsage;
        
        // Calculate unused solar (generated - consumed)
        // If consumed is somehow larger than generated, set unused to 0
        const solarUnused = Math.max(0, solarGeneration - solarConsumed);
        
        // Set the usage data
        setUsageData({
          solarGenerated: parseFloat(solarGeneration.toFixed(2)),
          solarConsumed: parseFloat(solarConsumed.toFixed(2)),
          solarDistributed: parseFloat(solarDistributed.toFixed(2)),
          solarCommonUtilities: parseFloat(commonUtilitiesUsage.toFixed(2)),
          solarUnused: parseFloat(solarUnused.toFixed(2)),
          gridConsumed: parseFloat(gridConsumed.toFixed(2))
        });
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
