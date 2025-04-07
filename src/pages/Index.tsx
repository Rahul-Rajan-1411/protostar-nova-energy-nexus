
import React from 'react';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import UsagePattern from '@/components/UsagePattern';
import UsageDetails from '@/components/UsageDetails';
import DateSelector from '@/components/DateSelector';
import { Building, Zap, PowerOff, Sun } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <DateSelector />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total Projects" 
            value={0}
            icon={<Building className="h-6 w-6" />}
            activeCount={0}
            inactiveCount={0}
          />
          
          <StatCard 
            title="Total SPDU Devices" 
            value={0}
            icon={<Zap className="h-6 w-6" />}
            activeCount={0}
            inactiveCount={0}
          />
          
          <StatCard 
            title="Total Central Devices" 
            value={0}
            icon={<PowerOff className="h-6 w-6" />}
            activeCount={0}
            inactiveCount={0}
          />
          
          <StatCard 
            title="Total Solar Generated" 
            value="0.00"
            valueUnit="MWh"
            icon={<Sun className="h-6 w-6" />}
            consumedValue="0.00 MWh"
            unusedValue="0.00 MWh"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UsagePattern />
          <UsageDetails />
        </div>
      </main>
    </div>
  );
};

export default Index;
