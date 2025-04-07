
import React, { useState } from 'react';
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
  const [dateRange, setDateRange] = useState<DateRangeType>('day');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleDateRangeChange = (type: DateRangeType, start?: Date, end?: Date) => {
    setDateRange(type);
    setStartDate(start);
    setEndDate(end);
  };

  // Query to fetch stats data
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats', dateRange, startDate, endDate],
    queryFn: async () => {
      try {
        // Fetch counts for projects, devices, and central devices
        const [projectsResponse, spdusResponse, centralDevicesResponse, readingsResponse] = await Promise.all([
          supabase.from('projects').select('id, status').eq('status', 'active'),
          supabase.from('spdus').select('id, status'),
          supabase.from('central_devices').select('id, status'),
          fetchReadingsData()
        ]);

        if (projectsResponse.error) throw projectsResponse.error;
        if (spdusResponse.error) throw spdusResponse.error;
        if (centralDevicesResponse.error) throw centralDevicesResponse.error;

        const activeProjects = projectsResponse.data.filter(p => p.status === 'active').length;
        const inactiveProjects = projectsResponse.data.length - activeProjects;

        const activeSpdus = spdusResponse.data.filter(s => s.status === 'active').length;
        const inactiveSpdus = spdusResponse.data.length - activeSpdus;

        const activeCentralDevices = centralDevicesResponse.data.filter(d => d.status === 'active').length;
        const inactiveCentralDevices = centralDevicesResponse.data.length - inactiveCentralDevices;

        return {
          projects: {
            total: projectsResponse.data.length,
            active: activeProjects,
            inactive: inactiveProjects
          },
          spdus: {
            total: spdusResponse.data.length,
            active: activeSpdus,
            inactive: inactiveSpdus
          },
          centralDevices: {
            total: centralDevicesResponse.data.length,
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
    let query = supabase.from('spdu_readings').select('source1_kwh, source2_kwh, timestamp');

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
    if (error) throw error;

    // Calculate solar totals
    const totalSolar = data.reduce((sum, item) => sum + Number(item.source2_kwh || 0), 0);
    const totalGrid = data.reduce((sum, item) => sum + Number(item.source1_kwh || 0), 0);
    
    // Calculate consumed/unused ratios (In a real app, this would be more precise)
    const consumed = totalSolar * 0.95; // 95% of generated solar is consumed
    const unused = totalSolar * 0.05; // 5% unused/lost

    return {
      total: parseFloat(totalSolar.toFixed(2)),
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
          />
          <UsageDetails 
            dateRange={dateRange} 
            startDate={startDate} 
            endDate={endDate} 
          />
        </div>

        <ProjectsMap />
      </main>
    </div>
  );
};

export default Index;
