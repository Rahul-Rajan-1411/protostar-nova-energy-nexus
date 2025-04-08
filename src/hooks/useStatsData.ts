
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
      
      // Now query the readings based on the meter IDs and date filters
      let readingsQuery = supabase
        .from('building_meter_readings')
        .select('reading, building_meter_id, timestamp')
        .in('building_meter_id', meterIds);
      
      // Also get SPDU readings for grid power
      let spduQuery = supabase
        .from('spdu_readings')
        .select('source1_kwh, source2_kwh, timestamp');
      
      // Apply date filtering based on the selected range
      switch (dateRange) {
        case 'day':
          // During development, we use March 31, 2023 as the "present day"
          const developmentDate = new Date(2023, 2, 31); // March 31, 2023
          const dayStart = new Date(developmentDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(developmentDate);
          dayEnd.setHours(23, 59, 59, 999);
          
          readingsQuery = readingsQuery
            .gte('timestamp', dayStart.toISOString())
            .lte('timestamp', dayEnd.toISOString());
          
          spduQuery = spduQuery
            .gte('timestamp', dayStart.toISOString())
            .lte('timestamp', dayEnd.toISOString());
          break;
          
        case 'month':
          const monthStart = new Date(selectedMonth?.getFullYear() || 2023, selectedMonth?.getMonth() || 2, 1);
          const monthEnd = new Date(selectedMonth?.getFullYear() || 2023, (selectedMonth?.getMonth() || 2) + 1, 0, 23, 59, 59, 999);
          
          readingsQuery = readingsQuery
            .gte('timestamp', monthStart.toISOString())
            .lte('timestamp', monthEnd.toISOString());
          
          spduQuery = spduQuery
            .gte('timestamp', monthStart.toISOString())
            .lte('timestamp', monthEnd.toISOString());
          break;
          
        case 'custom':
          if (startDate) {
            const customStart = new Date(startDate);
            customStart.setHours(0, 0, 0, 0);
            readingsQuery = readingsQuery.gte('timestamp', customStart.toISOString());
            spduQuery = spduQuery.gte('timestamp', customStart.toISOString());
          }
          if (endDate) {
            const customEnd = new Date(endDate);
            customEnd.setHours(23, 59, 59, 999);
            readingsQuery = readingsQuery.lte('timestamp', customEnd.toISOString());
            spduQuery = spduQuery.lte('timestamp', customEnd.toISOString());
          }
          break;
        case 'lifetime':
          // No date filtering for lifetime
          break;
      }

      const [readingsResponse, spduResponse] = await Promise.all([
        readingsQuery,
        spduQuery
      ]);
      
      if (readingsResponse.error) throw readingsResponse.error;
      if (spduResponse.error) throw spduResponse.error;
      
      // Sum up the solar generation readings
      const totalSolarGeneration = readingsResponse.data?.reduce((sum, item) => sum + Number(item.reading || 0), 0) || 0;
      
      // Add SPDU readings if available
      const totalSolarFromSPDU = spduResponse.data?.reduce((sum, item) => sum + Number(item.source2_kwh || 0), 0) || 0;
      const totalGrid = spduResponse.data?.reduce((sum, item) => sum + Number(item.source1_kwh || 0), 0) || 0;
      
      // Total solar is the sum from both sources
      const totalSolar = totalSolarGeneration + totalSolarFromSPDU;
      
      // Calculate consumed/unused ratios (In a real app, this would be more precise)
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
