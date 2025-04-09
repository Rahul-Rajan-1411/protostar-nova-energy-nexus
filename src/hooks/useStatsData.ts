
import { useState } from 'react';
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

export const useStatsData = (
  dateRange: DateRangeType,
  startDate?: Date,
  endDate?: Date,
  selectedMonth?: Date
) => {
  // Helper function to fetch solar generation data from building_meters and building_meter_readings
  const fetchSolarGenerationData = async () => {
    try {
      // First, get the solar generation meter IDs
      const { data: solarMeters, error: metersError } = await supabase
        .from('building_meters')
        .select('id')
        .eq('meter_type', 'solar_generation');
      
      if (metersError) throw metersError;
      
      if (!solarMeters || solarMeters.length === 0) {
        console.log('No solar generation meters found');
        // Return default values if no solar meters found
        return {
          total: 0,
          consumed: 0, 
          unused: 0,
          grid: 0
        };
      }
      
      // Extract meter IDs
      const meterIds = solarMeters.map(meter => meter.id);
      
      // Format date range for query
      const { formattedStartDate, formattedEndDate } = formatDateRange(dateRange, startDate, endDate, selectedMonth);
      
      // Get earliest readings after start date for solar meters
      const { data: startReadings, error: startReadingsError } = await supabase
        .from('building_meter_readings')
        .select('building_meter_id, reading, timestamp')
        .in('building_meter_id', meterIds)
        .gte('timestamp', formattedStartDate)
        .order('timestamp', { ascending: true })
        .limit(meterIds.length);
      
      if (startReadingsError) throw startReadingsError;
      
      // Get latest readings before end date for solar meters
      const { data: endReadings, error: endReadingsError } = await supabase
        .from('building_meter_readings')
        .select('building_meter_id, reading, timestamp')
        .in('building_meter_id', meterIds)
        .lte('timestamp', formattedEndDate)
        .order('timestamp', { ascending: false })
        .limit(meterIds.length);
      
      if (endReadingsError) throw endReadingsError;
      
      // Get SPDU readings for the same period
      const { data: spduStartReadings, error: spduStartError } = await supabase
        .from('spdu_readings')
        .select('spdu_id, source1_kwh, source2_kwh, timestamp')
        .gte('timestamp', formattedStartDate)
        .order('timestamp', { ascending: true });
      
      if (spduStartError) throw spduStartError;
      
      const { data: spduEndReadings, error: spduEndError } = await supabase
        .from('spdu_readings')
        .select('spdu_id, source1_kwh, source2_kwh, timestamp')
        .lte('timestamp', formattedEndDate)
        .order('timestamp', { ascending: false });
      
      if (spduEndError) throw spduEndError;
      
      // Calculate total solar generation (difference between first and last readings)
      let totalSolarGeneration = 0;
      if (endReadings && startReadings && endReadings.length > 0 && startReadings.length > 0) {
        // Group readings by meter ID
        const startReadingByMeterId = groupBy(startReadings, 'building_meter_id');
        const endReadingByMeterId = groupBy(endReadings, 'building_meter_id');
        
        // Calculate the difference for each meter
        meterIds.forEach(meterId => {
          const start = startReadingByMeterId[meterId]?.[0];
          const end = endReadingByMeterId[meterId]?.[0];
          
          if (start && end) {
            totalSolarGeneration += (Number(end.reading) - Number(start.reading));
          } else if (end && !start) {
            // If we only have end readings, just use those (lifetime case)
            totalSolarGeneration += Number(end.reading);
          }
        });
      } else if (endReadings && endReadings.length > 0) {
        // If we only have end readings (for lifetime view), sum them up
        totalSolarGeneration = endReadings.reduce((sum, item) => sum + Number(item.reading || 0), 0);
      }
      
      // Calculate SPDU consumption (solar and grid)
      let totalSolarFromSPDU = 0;
      let totalGrid = 0;
      
      if (spduEndReadings && spduStartReadings && spduEndReadings.length > 0 && spduStartReadings.length > 0) {
        // Group readings by SPDU ID
        const startReadingBySpduId = groupBy(spduStartReadings, 'spdu_id');
        const endReadingBySpduId = groupBy(spduEndReadings, 'spdu_id');
        
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
            totalSolarFromSPDU += (Number(end.source2_kwh) - Number(start.source2_kwh));
            totalGrid += (Number(end.source1_kwh) - Number(start.source1_kwh));
          } else if (end && !start) {
            // If we only have end readings, just use those (lifetime case)
            totalSolarFromSPDU += Number(end.source2_kwh);
            totalGrid += Number(end.source1_kwh);
          }
        });
      } else if (spduEndReadings && spduEndReadings.length > 0) {
        // If we only have end readings (for lifetime view), sum them up
        totalSolarFromSPDU = spduEndReadings.reduce((sum, item) => sum + Number(item.source2_kwh || 0), 0);
        totalGrid = spduEndReadings.reduce((sum, item) => sum + Number(item.source1_kwh || 0), 0);
      }
      
      // Convert to MWh (divide by 1000)
      totalSolarGeneration = totalSolarGeneration / 1000;
      totalSolarFromSPDU = totalSolarFromSPDU / 1000;
      totalGrid = totalGrid / 1000;
      
      // Total solar is the sum from both sources
      const totalSolar = totalSolarGeneration + totalSolarFromSPDU;
      
      // Calculate consumed/unused ratios (use 95% consumed as in the original code)
      const consumed = totalSolar * 0.95; // 95% of generated solar is consumed
      const unused = totalSolar * 0.05; // 5% unused/lost

      return {
        total: parseFloat(totalSolar.toFixed(2)),
        consumed: parseFloat(consumed.toFixed(2)),
        unused: parseFloat(unused.toFixed(2)),
        grid: parseFloat(totalGrid.toFixed(2))
      };
    } catch (error) {
      console.error('Error fetching solar generation data:', error);
      return {
        total: 0,
        consumed: 0,
        unused: 0,
        grid: 0
      };
    }
  };

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

  // Query to fetch stats data
  return useQuery({
    queryKey: ['stats', dateRange, startDate, endDate, selectedMonth],
    queryFn: async () => {
      try {
        console.log('Fetching stats data...');
        // Fetch counts for projects, devices, and central devices
        const [projectsResponse, spdusResponse, centralDevicesResponse, solarGenResponse] = await Promise.all([
          supabase.from('projects').select('id, status'),
          supabase.from('spdus').select('id, status'),
          supabase.from('central_devices').select('id, status'),
          fetchSolarGenerationData()
        ]);

        console.log('SPDU Response:', spdusResponse);

        if (projectsResponse.error) throw projectsResponse.error;
        if (spdusResponse.error) throw spdusResponse.error;
        if (centralDevicesResponse.error) throw centralDevicesResponse.error;

        const projects = projectsResponse.data || [];
        const spdus = spdusResponse.data || [];
        const centralDevices = centralDevicesResponse.data || [];

        const activeProjects = projects.filter(p => p.status === 'active').length;
        const inactiveProjects = projects.length - activeProjects;

        // Properly count active and inactive SPDUs
        const activeSpdus = spdus.filter(s => s.status === 'active').length;
        const inactiveSpdus = spdus.length - activeSpdus;

        const activeCentralDevices = centralDevices.filter(d => d.status === 'active').length;
        const inactiveCentralDevices = centralDevices.length - activeCentralDevices;

        return {
          projects: {
            total: projects.length,
            active: activeProjects,
            inactive: inactiveProjects
          },
          spdus: {
            total: spdus.length,
            active: activeSpdus,
            inactive: inactiveSpdus
          },
          centralDevices: {
            total: centralDevices.length,
            active: activeCentralDevices,
            inactive: inactiveCentralDevices
          },
          solar: solarGenResponse
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
