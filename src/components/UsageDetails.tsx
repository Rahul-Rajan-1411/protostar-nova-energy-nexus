
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

const UsageDetails = ({ dateRange, startDate, endDate }: UsageDetailsProps) => {
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
          const solarTotal = data.reduce((sum, item) => sum + Number(item.source2_kwh || 0), 0);
          const gridTotal = data.reduce((sum, item) => sum + Number(item.source1_kwh || 0), 0);
          
          // For this example, we'll simulate the detailed breakdown
          // In a real app, this would come from more detailed calculations
          const solarConsumed = solarTotal * 0.7; // 70% of generated solar is consumed
          const solarDistributed = solarTotal * 0.15; // 15% distributed to grid
          const solarCommonUtilities = solarTotal * 0.1; // 10% used for common areas
          const solarUnused = solarTotal * 0.05; // 5% unused/lost
          
          setUsageData({
            solarGenerated: parseFloat(solarTotal.toFixed(2)),
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
  }, [dateRange, startDate, endDate]);

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
