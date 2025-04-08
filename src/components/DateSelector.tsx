
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, subMonths } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

export type DateRangeType = 'day' | 'month' | 'custom' | 'lifetime';

interface DateSelectorProps {
  onDateRangeChange: (type: DateRangeType, startDate?: Date, endDate?: Date, selectedMonth?: Date) => void;
}

const DateSelector = ({ onDateRangeChange }: DateSelectorProps) => {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>('day');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  // Use March 31, 2023 as the default "present day" during development
  const [currentDate] = useState<Date>(new Date(2023, 2, 31)); // March 31, 2023
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2023, 2, 1)); // March 2023

  useEffect(() => {
    // Initial data load with default date range (day)
    handleRangeChange('day');
  }, []);

  const handleRangeChange = (value: string) => {
    const rangeType = value as DateRangeType;
    setSelectedRange(rangeType);
    
    // Reset custom date selection when changing to non-custom options
    if (rangeType !== 'custom') {
      setStartDate(undefined);
      setEndDate(undefined);
      
      if (rangeType === 'day') {
        // Use March 31, 2023 as the "present day" during development
        onDateRangeChange(rangeType, currentDate, undefined);
      } else if (rangeType === 'month') {
        onDateRangeChange(rangeType, undefined, undefined, selectedMonth);
      } else {
        onDateRangeChange(rangeType);
      }
    }
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setIsStartDateOpen(false);
    
    if (date && endDate && selectedRange === 'custom') {
      onDateRangeChange('custom', date, endDate);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setIsEndDateOpen(false);
    
    if (startDate && date && selectedRange === 'custom') {
      onDateRangeChange('custom', startDate, date);
    }
  };

  const handlePreviousMonth = () => {
    const prevMonth = subMonths(selectedMonth, 1);
    setSelectedMonth(prevMonth);
    onDateRangeChange('month', undefined, undefined, prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    setSelectedMonth(nextMonth);
    onDateRangeChange('month', undefined, undefined, nextMonth);
  };

  return (
    <div className="flex flex-col mb-6">
      <div className="flex items-end justify-end mb-2 gap-2">
        <Select value={selectedRange} onValueChange={handleRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
            <SelectItem value="lifetime">Lifetime</SelectItem>
          </SelectContent>
        </Select>

        {selectedRange === 'custom' && (
          <>
            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[160px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[160px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  initialFocus
                  disabled={(date) => startDate ? date < startDate : false}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {selectedRange === 'month' && (
        <div className="flex items-center justify-end mb-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="mx-4 font-medium">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
