import React, { useState } from 'react';
import Header from '@/components/Header';
import DateSelector, { DateRangeType } from '@/components/DateSelector';
import UsagePattern from '@/components/UsagePattern';
import UsageDetails from '@/components/UsageDetails';
import { format } from 'date-fns';

const Analytics = () => {
  // Use March 31, 2024 as the default "present day" during development
  const [currentDate] = useState<Date>(new Date(2024, 2, 31)); // March 31, 2024
  const [dateRange, setDateRange] = useState<DateRangeType>('day');
  const [startDate, setStartDate] = useState<Date>(currentDate);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2024, 2, 1)); // March 2024

  const handleDateRangeChange = (type: DateRangeType, start?: Date, end?: Date, month?: Date) => {
    setDateRange(type);
    
    if (type === 'day') {
      // Use the passed date or default to current date
      setStartDate(start || currentDate);
      setEndDate(undefined);
    } else if (type === 'month') {
      setSelectedMonth(month || new Date(2024, 2, 1)); // Default to March 2024
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
  
  // Format the current date for display
  const formattedCurrentDate = format(currentDate, 'dd/MM/yyyy');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-medium text-gray-600">
            Current Date: <span className="font-bold">{formattedCurrentDate}</span>
          </div>
          <DateSelector onDateRangeChange={handleDateRangeChange} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </main>
    </div>
  );
};

export default Analytics;
