
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
  const [usageData, setUsageData] = useState({
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
        let spduQuery = supabase.from('spdu_readings')
          .select('source1_kwh, source2_kwh, timestamp');
        
        let buildingMeterQuery = supabase.from('building_meter_readings')
          .select('reading, timestamp');

        // Apply date filtering based on the selected range
        switch (dateRange) {
          case 'day':
            // During development, we use March 31, 2023 as the "present day"
            if (startDate) {
              const dayStart = new Date(startDate);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(startDate);
              dayEnd.setHours(23, 59, 59, 999);
              
              spduQuery = spduQuery
                .gte('timestamp', dayStart.toISOString())
                .lte('timestamp', dayEnd.toISOString());
              
              buildingMeterQuery = buildingMeterQuery
                .gte('timestamp', dayStart.toISOString())
                .lte('timestamp', dayEnd.toISOString());
            } else {
              // Default to March 31, 2023 during development
              const defaultDay = new Date(2023, 2, 31); // March 31, 2023
              const dayStart = new Date(defaultDay);
              dayStart.setHours(0, 0, 0, 0);
              const dayEnd = new Date(defaultDay);
              dayEnd.setHours(23, 59, 59, 999);
              
              spduQuery = spduQuery
                .gte('timestamp', dayStart.toISOString())
                .lte('timestamp', dayEnd.toISOString());
              
              buildingMeterQuery = buildingMeterQuery
                .gte('timestamp', dayStart.toISOString())
                .lte('timestamp', dayEnd.toISOString());
            }
            break;
            
          case 'month':
            if (selectedMonth) {
              const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
              const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
              
              spduQuery = spduQuery
                .gte('timestamp', monthStart.toISOString())
                .lte('timestamp', monthEnd.toISOString());
              
              buildingMeterQuery = buildingMeterQuery
                .gte('timestamp', monthStart.toISOString())
                .lte('timestamp', monthEnd.toISOString());
            } else {
              // Default to March 2023 during development
              const defaultMonth = new Date(2023, 2, 1); // March 2023
              const monthStart = new Date(defaultMonth);
              const monthEnd = new Date(2023, 2 + 1, 0, 23, 59, 59, 999);
              
              spduQuery = spduQuery
                .gte('timestamp', monthStart.toISOString())
                .lte('timestamp', monthEnd.toISOString());
              
              buildingMeterQuery = buildingMeterQuery
                .gte('timestamp', monthStart.toISOString())
                .lte('timestamp', monthEnd.toISOString());
            }
            break;
            
          case 'custom':
            if (startDate) {
              const customStart = new Date(startDate);
              customStart.setHours(0, 0, 0, 0);
              spduQuery = spduQuery.gte('timestamp', customStart.toISOString());
              buildingMeterQuery = buildingMeterQuery.gte('timestamp', customStart.toISOString());
            }
            if (endDate) {
              const customEnd = new Date(endDate);
              customEnd.setHours(23, 59, 59, 999);
              spduQuery = spduQuery.lte('timestamp', customEnd.toISOString());
              buildingMeterQuery = buildingMeterQuery.lte('timestamp', customEnd.toISOString());
            }
            break;
            
          case 'lifetime':
            // No date filtering for lifetime
            break;
        }

        const [spduData, buildingMeterData] = await Promise.all([
          spduQuery,
          buildingMeterQuery
        ]);

        if (spduData.error) throw spduData.error;
        if (buildingMeterData.error) throw buildingMeterData.error;

        if (spduData.data && spduData.data.length > 0) {
          // Calculate solar totals from SPDU readings
          const solarTotal = spduData.data.reduce((sum, item) => sum + Number(item.source2_kwh || 0), 0);
          const gridTotal = spduData.data.reduce((sum, item) => sum + Number(item.source1_kwh || 0), 0);
          
          // Add building meter readings if available
          const buildingMeterTotal = buildingMeterData.data?.reduce((sum, item) => sum + Number(item.reading || 0), 0) || 0;
          const totalGenerated = solarTotal + buildingMeterTotal;
          
          // For this example, we'll simulate the detailed breakdown
          // In a real app, this would come from more detailed calculations
          const solarConsumed = totalGenerated * 0.7; // 70% of generated solar is consumed
          const solarDistributed = totalGenerated * 0.15; // 15% distributed to grid
          const solarCommonUtilities = totalGenerated * 0.1; // 10% used for common areas
          const solarUnused = totalGenerated * 0.05; // 5% unused/lost
          
          setUsageData({
            solarGenerated: parseFloat(totalGenerated.toFixed(2)),
            solarConsumed: parseFloat(solarConsumed.toFixed(2)),
            solarDistributed: parseFloat(solarDistributed.toFixed(2)),
            solarCommonUtilities: parseFloat(solarCommonUtilities.toFixed(2)),
            solarUnused: parseFloat(solarUnused.toFixed(2)),
            gridConsumed: parseFloat(gridTotal.toFixed(2))
          });
        } else {
          // Reset data when no results
          setUsageData({
            solarGenerated: 0,
            solarConsumed: 0,
            solarDistributed: 0,
            solarCommonUtilities: 0,
            solarUnused: 0,
            gridConsumed: 0
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
