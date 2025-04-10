
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { DateRangeType } from '@/components/DateSelector';

export interface StatsData {
  projects: {
    total: number;
    active: number;
    inactive: number;
  };
  spdus: {
    total: number;
    active: number;
    inactive: number;
  };
  centralDevices: {
    total: number;
    active: number;
    inactive: number;
  };
  solar: {
    total: number;
    consumed: number;
    unused: number;
    grid: number;
  };
}

// Define the types for our Supabase RPC functions
interface EnergyData {
  generated: number;
  consumed: number;
  distributed: number;
  commonUtilities: number;
  unused: number;
  gridConsumed: number;
  [key: string]: any;
}

interface ProjectStats {
  projects: {
    total: number;
    active: number;
    inactive: number;
  };
  spdus: {
    total: number;
    active: number;
    inactive: number;
  };
  centralDevices: {
    total: number;
    active: number;
    inactive: number;
  };
}

export const useStatsData = (
  dateRange: DateRangeType,
  startDate?: Date,
  endDate?: Date,
  selectedMonth?: Date
) => {
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

  // Query to fetch stats data
  return useQuery({
    queryKey: ['stats', dateRange, startDate, endDate, selectedMonth],
    queryFn: async () => {
      try {
        console.log('Fetching stats data...');
        
        // Format date range for energy data query
        const { formattedStartDate, formattedEndDate } = formatDateRange(dateRange, startDate, endDate, selectedMonth);
        
        // Fetch project stats using RPC
        console.log('Fetching project stats...');
        const { data: projectStatsData, error: projectStatsError } = await supabase.rpc('get_project_stats');
        
        if (projectStatsError) {
          console.error('Error fetching project stats:', projectStatsError);
          throw projectStatsError;
        }
        
        console.log('Project stats data:', projectStatsData);
        
        // Convert dateRange to required format for the Supabase function
        // Function expects 'Day', 'Month', 'Custom', 'Lifetime' formats
        const formattedDateRange = dateRange.charAt(0).toUpperCase() + dateRange.slice(1);
        console.log('Using date range format:', formattedDateRange);
        console.log('Start date:', formattedStartDate);
        console.log('End date:', formattedEndDate);
        
        // Fetch energy data using RPC with properly formatted date range
        console.log('Fetching energy data...');
        const { data: energyData, error: energyError } = await supabase.rpc('get_energy_data', {
          p_date_range: formattedDateRange,
          p_start_date: formattedStartDate,
          p_end_date: formattedEndDate
        });
        
        if (energyError) {
          console.error('Error fetching energy data:', energyError);
          throw energyError;
        }
        
        console.log('Energy data from RPC:', energyData);
        
        // Type assertions and safe fallbacks
        const typedProjectStats = projectStatsData as ProjectStats;
        const typedEnergyData = energyData as EnergyData;
        
        // Organize the data with type safety
        const projects = typedProjectStats?.projects || { total: 0, active: 0, inactive: 0 };
        const spdus = typedProjectStats?.spdus || { total: 0, active: 0, inactive: 0 };
        const centralDevices = typedProjectStats?.centralDevices || { total: 0, active: 0, inactive: 0 };
        
        // If the date is in the future, return zeros for energy data
        const now = new Date();
        const queryDate = startDate || selectedMonth || now;
        const isDateInFuture = queryDate > now;
        
        const solar = isDateInFuture ? 
          { total: 0, consumed: 0, unused: 0, grid: 0 } : 
          {
            total: Number(typedEnergyData?.generated || 0),
            consumed: Number(typedEnergyData?.consumed || 0),
            unused: Number(typedEnergyData?.unused || 0),
            grid: Number(typedEnergyData?.gridConsumed || 0)
          };

        const result: StatsData = {
          projects,
          spdus,
          centralDevices,
          solar
        };
        
        console.log('Final stats result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard statistics',
          variant: 'destructive',
        });
        return {
          projects: { total: 0, active: 0, inactive: 0 },
          spdus: { total: 0, active: 0, inactive: 0 },
          centralDevices: { total: 0, active: 0, inactive: 0 },
          solar: { total: 0, consumed: 0, unused: 0, grid: 0 }
        };
      }
    }
  });
};
