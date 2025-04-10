
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
        const { data: projectStatsData, error: projectStatsError } = await supabase.rpc('get_project_stats') as { data: ProjectStats | null, error: any };
        
        if (projectStatsError) throw projectStatsError;
        
        // Fetch energy data using RPC
        const { data: energyData, error: energyError } = await supabase.rpc('get_energy_data', {
          p_date_range: dateRange,
          p_start_date: formattedStartDate,
          p_end_date: formattedEndDate
        }) as { data: EnergyData | null, error: any };
        
        if (energyError) throw energyError;
        
        console.log('Project stats:', projectStatsData);
        console.log('Energy data:', energyData);
        
        // Organize the data
        const projects = projectStatsData?.projects || { total: 0, active: 0, inactive: 0 };
        const spdus = projectStatsData?.spdus || { total: 0, active: 0, inactive: 0 };
        const centralDevices = projectStatsData?.centralDevices || { total: 0, active: 0, inactive: 0 };
        
        // If the date is in the future, return zeros for energy data
        const now = new Date();
        const queryDate = startDate || selectedMonth || now;
        const isDateInFuture = queryDate > now;
        
        const solar = isDateInFuture ? 
          { total: 0, consumed: 0, unused: 0, grid: 0 } : 
          {
            total: Number(energyData?.generated) || 0,
            consumed: Number(energyData?.consumed) || 0,
            unused: Number(energyData?.unused) || 0,
            grid: Number(energyData?.gridConsumed) || 0
          };

        return {
          projects,
          spdus,
          centralDevices,
          solar
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard statistics',
          variant: 'destructive',
        });
        return null;
      }
    }
  });
};
