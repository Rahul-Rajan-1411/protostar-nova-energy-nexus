
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import UsagePattern from '@/components/UsagePattern';
import UsageDetails from '@/components/UsageDetails';
import DateSelector, { DateRangeType } from '@/components/DateSelector';
import ProjectsMap from '@/components/ProjectsMap';
import { Building, Zap, PowerOff, Sun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const Index = () => {
  // Use March 31, 2023 as the default "present day" during development
  const [currentDate] = useState<Date>(new Date(2023, 2, 31)); // March 31, 2023
  const [dateRange, setDateRange] = useState<DateRangeType>('day');
  const [startDate, setStartDate] = useState<Date>(currentDate);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2023, 2, 1)); // March 2023

  const handleDateRangeChange = (type: DateRangeType, start?: Date, end?: Date, month?: Date) => {
    setDateRange(type);
    
    if (type === 'day') {
      // Use the passed date or default to current date
      setStartDate(start || currentDate);
      setEndDate(undefined);
    } else if (type === 'month') {
      setSelectedMonth(month || new Date(2023, 2, 1)); // Default to March 2023
      setStartDate(undefined);
      setEndDate(undefined);
    } else if (type === 'custom') {
      if (start) setStartDate(start);
      if (end) setEndDate(end);
    } else {
      // Lifetime - reset dates
      setStartDate(undefined);
      setEndDate(undefined);
    }
  };

  // Query to fetch stats data
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', dateRange, startDate, endDate, selectedMonth],
    queryFn: async () => {
      try {
        // Fetch counts for projects, devices, and central devices
        const [projectsResponse, spdusResponse, centralDevicesResponse, readingsResponse] = await Promise.all([
          supabase.from('projects').select('id, status'),
          supabase.from('spdus').select('id, status'),
          supabase.from('central_devices').select('id, status'),
          fetchReadingsData()
        ]);

        if (projectsResponse.error) throw projectsResponse.error;
        if (spdusResponse.error) throw spdusResponse.error;
        if (centralDevicesResponse.error) throw centralDevicesResponse.error;

        const projects = projectsResponse.data || [];
        const spdus = spdusResponse.data || [];
        const centralDevices = centralDevicesResponse.data || [];

        const activeProjects = projects.filter(p => p.status === 'active').length;
        const inactiveProjects = projects.length - activeProjects;

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
          solar: readingsResponse
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

  // Helper function to fetch readings data based on date range
  const fetchReadingsData = async () => {
    let spduQuery = supabase.from('spdu_readings')
      .select('source1_kwh, source2_kwh, timestamp');
    
    let buildingMeterQuery = supabase.from('building_meter_readings')
      .select('reading, timestamp');

    // Apply date filtering based on the selected range
    switch (dateRange) {
      case 'day':
        // During development, we use March 31, 2023 as the "present day"
        const developmentDate = new Date(2023, 2, 31); // March 31, 2023
        const dayStart = new Date(developmentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(developmentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        spduQuery = spduQuery
          .gte('timestamp', dayStart.toISOString())
          .lte('timestamp', dayEnd.toISOString());
        
        buildingMeterQuery = buildingMeterQuery
          .gte('timestamp', dayStart.toISOString())
          .lte('timestamp', dayEnd.toISOString());
        break;
        
      case 'month':
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59, 999);
        
        spduQuery = spduQuery
          .gte('timestamp', monthStart.toISOString())
          .lte('timestamp', monthEnd.toISOString());
        
        buildingMeterQuery = buildingMeterQuery
          .gte('timestamp', monthStart.toISOString())
          .lte('timestamp', monthEnd.toISOString());
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

    // Calculate solar totals from SPDU readings
    const totalSolar = spduData.data?.reduce((sum, item) => sum + Number(item.source2_kwh || 0), 0) || 0;
    const totalGrid = spduData.data?.reduce((sum, item) => sum + Number(item.source1_kwh || 0), 0) || 0;
    
    // Add building meter readings if available
    const buildingMeterTotal = buildingMeterData.data?.reduce((sum, item) => sum + Number(item.reading || 0), 0) || 0;
    
    // Calculate consumed/unused ratios (In a real app, this would be more precise)
    const consumed = totalSolar * 0.95; // 95% of generated solar is consumed
    const unused = totalSolar * 0.05; // 5% unused/lost

    return {
      total: parseFloat((totalSolar + buildingMeterTotal).toFixed(2)),
      consumed: parseFloat(consumed.toFixed(2)),
      unused: parseFloat(unused.toFixed(2)),
      grid: parseFloat(totalGrid.toFixed(2))
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <DateSelector onDateRangeChange={handleDateRangeChange} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total Projects" 
            value={statsLoading ? '...' : statsData?.projects.total || 0}
            icon={<Building className="h-6 w-6" />}
            activeCount={statsLoading ? undefined : statsData?.projects.active}
            inactiveCount={statsLoading ? undefined : statsData?.projects.inactive}
            className={statsLoading ? "animate-pulse" : ""}
          />
          
          <StatCard 
            title="Total SPDU Devices" 
            value={statsLoading ? '...' : statsData?.spdus.total || 0}
            icon={<Zap className="h-6 w-6" />}
            activeCount={statsLoading ? undefined : statsData?.spdus.active}
            inactiveCount={statsLoading ? undefined : statsData?.spdus.inactive}
            className={statsLoading ? "animate-pulse" : ""}
          />
          
          <StatCard 
            title="Total Central Devices" 
            value={statsLoading ? '...' : statsData?.centralDevices.total || 0}
            icon={<PowerOff className="h-6 w-6" />}
            activeCount={statsLoading ? undefined : statsData?.centralDevices.active}
            inactiveCount={statsLoading ? undefined : statsData?.centralDevices.inactive}
            className={statsLoading ? "animate-pulse" : ""}
          />
          
          <StatCard 
            title="Total Solar Generated" 
            value={statsLoading ? '...' : statsData?.solar.total || 0}
            valueUnit="MWh"
            icon={<Sun className="h-6 w-6" />}
            consumedValue={statsLoading ? '...' : `${statsData?.solar.consumed || 0} MWh`}
            unusedValue={statsLoading ? '...' : `${statsData?.solar.unused || 0} MWh`}
            className={statsLoading ? "animate-pulse" : ""}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <UsagePattern 
            dateRange={dateRange} 
            startDate={startDate} 
            endDate={endDate}
            selectedMonth={selectedMonth}
          />
          <UsageDetails 
            dateRange={dateRange} 
            startDate={startDate} 
            endDate={endDate}
            selectedMonth={selectedMonth}
          />
        </div>

        <ProjectsMap />
      </main>
    </div>
  );
};

export default Index;
