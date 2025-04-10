
import { useState, useEffect } from 'react';
import { DateRangeType } from '@/components/DateSelector';

export const useDashboardDate = (initialDateRange: DateRangeType = 'day') => {
  // Use March 31, 2024 as the default "present day" during development
  const [currentDate] = useState<Date>(new Date(2024, 2, 31)); // March 31, 2024
  const [dateRange, setDateRange] = useState<DateRangeType>(initialDateRange);
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

  useEffect(() => {
    // Initialize with default date range
    handleDateRangeChange(initialDateRange);
  }, [initialDateRange]);

  return {
    currentDate,
    dateRange,
    startDate,
    endDate,
    selectedMonth,
    handleDateRangeChange
  };
};
