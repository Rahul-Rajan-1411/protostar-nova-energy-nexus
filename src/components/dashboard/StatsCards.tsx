
import React from 'react';
import StatCard from '@/components/StatCard';
import { Building, Zap, PowerOff, Sun } from 'lucide-react';
import { StatsData } from '@/hooks/useStatsData';

interface StatsCardsProps {
  statsData: StatsData | null;
  isLoading: boolean;
}

const StatsCards = ({ statsData, isLoading }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard 
        title="Total Projects" 
        value={isLoading ? '...' : statsData?.projects.total || 0}
        icon={<Building className="h-6 w-6" />}
        activeCount={isLoading ? undefined : statsData?.projects.active}
        inactiveCount={isLoading ? undefined : statsData?.projects.inactive}
        className={isLoading ? "animate-pulse" : ""}
      />
      
      <StatCard 
        title="Total SPDU Devices" 
        value={isLoading ? '...' : statsData?.spdus.total || 0}
        icon={<Zap className="h-6 w-6" />}
        activeCount={isLoading ? undefined : statsData?.spdus.active}
        inactiveCount={isLoading ? undefined : statsData?.spdus.inactive}
        className={isLoading ? "animate-pulse" : ""}
      />
      
      <StatCard 
        title="Total Central Devices" 
        value={isLoading ? '...' : statsData?.centralDevices.total || 0}
        icon={<PowerOff className="h-6 w-6" />}
        activeCount={isLoading ? undefined : statsData?.centralDevices.active}
        inactiveCount={isLoading ? undefined : statsData?.centralDevices.inactive}
        className={isLoading ? "animate-pulse" : ""}
      />
      
      <StatCard 
        title="Total Solar Generated" 
        value={isLoading ? '...' : statsData?.solar.total || 0}
        valueUnit="MWh"
        icon={<Sun className="h-6 w-6" />}
        consumedValue={isLoading ? '...' : `${statsData?.solar.consumed || 0} MWh`}
        unusedValue={isLoading ? '...' : `${statsData?.solar.unused || 0} MWh`}
        className={isLoading ? "animate-pulse" : ""}
      />
    </div>
  );
};

export default StatsCards;
