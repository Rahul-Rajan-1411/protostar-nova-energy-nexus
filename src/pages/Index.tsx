
import React from 'react';
import Header from '@/components/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import { useDashboardDate } from '@/hooks/useDashboardDate';

const Index = () => {
  const { 
    currentDate,
    dateRange, 
    startDate, 
    endDate, 
    selectedMonth,
    handleDateRangeChange
  } = useDashboardDate('day');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <Dashboard 
        currentDate={currentDate}
        dateRange={dateRange}
        startDate={startDate}
        endDate={endDate}
        selectedMonth={selectedMonth}
        onDateRangeChange={handleDateRangeChange}
      />
    </div>
  );
};

export default Index;
