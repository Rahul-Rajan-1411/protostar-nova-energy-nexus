
import React, { useState } from 'react';
import Header from '@/components/Header';
import DateSelector, { DateRangeType } from '@/components/DateSelector';
import UsagePattern from '@/components/UsagePattern';
import UsageDetails from '@/components/UsageDetails';

const Analytics = () => {
  const [dateRange, setDateRange] = useState<DateRangeType>('day');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleDateRangeChange = (type: DateRangeType, start?: Date, end?: Date) => {
    setDateRange(type);
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>
        
        <DateSelector onDateRangeChange={handleDateRangeChange} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </main>
    </div>
  );
};

export default Analytics;
