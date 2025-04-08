
import React from 'react';
import { format } from 'date-fns';
import DateSelector, { DateRangeType } from '@/components/DateSelector';
import StatsCards from './StatsCards';
import UsagePattern from '@/components/UsagePattern';
import UsageDetails from '@/components/UsageDetails';
import ProjectsMap from '@/components/ProjectsMap';
import { useStatsData } from '@/hooks/useStatsData';

interface DashboardProps {
  currentDate: Date;
  dateRange: DateRangeType;
  startDate: Date | undefined;
  endDate: Date | undefined;
  selectedMonth: Date;
  onDateRangeChange: (type: DateRangeType, start?: Date, end?: Date, month?: Date) => void;
}

const Dashboard = ({ 
  currentDate, 
  dateRange, 
  startDate, 
  endDate, 
  selectedMonth, 
  onDateRangeChange 
}: DashboardProps) => {
  // Fetch stats data
  const { data: statsData, isLoading: statsLoading } = useStatsData(
    dateRange, 
    startDate, 
    endDate, 
    selectedMonth
  );

  // Format the current date for display
  const formattedCurrentDate = format(currentDate, 'dd/MM/yyyy');

  return (
    <main className="flex-1 container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm font-medium text-gray-600">
          Current Date: <span className="font-bold">{formattedCurrentDate}</span>
        </div>
        <DateSelector onDateRangeChange={onDateRangeChange} />
      </div>

      <StatsCards 
        statsData={statsData}
        isLoading={statsLoading}
      />

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
  );
};

export default Dashboard;
