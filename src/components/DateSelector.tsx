
import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format, addMonths, subMonths, parse } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [startDateText, setStartDateText] = useState<string>('');
  const [endDateText, setEndDateText] = useState<string>('');
  // Use March 31, 2024 as the default "present day" during development
  const [currentDate] = useState<Date>(new Date(2024, 2, 31)); // March 31, 2024
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(2024, 2, 1)); // March 2024

  useEffect(() => {
    // Initial data load with default date range (day)
    handleRangeChange('day');
  }, []);

  useEffect(() => {
    // Update text when dates change
    if (startDate) {
      setStartDateText(format(startDate, 'dd/MM/yy'));
    }
    if (endDate) {
      setEndDateText(format(endDate, 'dd/MM/yy'));
    }
  }, [startDate, endDate]);

  const handleRangeChange = (value: string) => {
    const rangeType = value as DateRangeType;
    setSelectedRange(rangeType);
    
    // Reset custom date selection when changing to non-custom options
    if (rangeType !== 'custom') {
      setStartDate(undefined);
      setEndDate(undefined);
      setStartDateText('');
      setEndDateText('');
      
      if (rangeType === 'day') {
        // Use March 31, 2024 as the "present day" during development
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
    
    if (date) {
      setStartDateText(format(date, 'dd/MM/yy'));
      
      if (endDate && selectedRange === 'custom') {
        onDateRangeChange('custom', date, endDate);
      }
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setIsEndDateOpen(false);
    
    if (date) {
      setEndDateText(format(date, 'dd/MM/yy'));
      
      if (startDate && selectedRange === 'custom') {
        onDateRangeChange('custom', startDate, date);
      }
    }
  };

  const handleStartDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDateText(e.target.value);
    
    if (e.target.value.length === 8) { // Format: DD/MM/YY
      try {
        // Parse the date from the input
        const parsedDate = parse(e.target.value, 'dd/MM/yy', new Date());
        
        if (!isNaN(parsedDate.getTime())) {
          setStartDate(parsedDate);
          
          if (endDate && selectedRange === 'custom') {
            onDateRangeChange('custom', parsedDate, endDate);
          }
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }
  };

  const handleEndDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDateText(e.target.value);
    
    if (e.target.value.length === 8) { // Format: DD/MM/YY
      try {
        // Parse the date from the input
        const parsedDate = parse(e.target.value, 'dd/MM/yy', new Date());
        
        if (!isNaN(parsedDate.getTime())) {
          setEndDate(parsedDate);
          
          if (startDate && selectedRange === 'custom') {
            onDateRangeChange('custom', startDate, parsedDate);
          }
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
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
                  className="w-[160px] justify-start text-left font-normal relative"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="DD/MM/YY"
                    value={startDateText}
                    onChange={handleStartDateTextChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStartDateOpen(true);
                    }}
                  />
                  {startDateText || "Start date"}
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
                  className="w-[160px] justify-start text-left font-normal relative"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="DD/MM/YY"
                    value={endDateText}
                    onChange={handleEndDateTextChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEndDateOpen(true);
                    }}
                  />
                  {endDateText || "End date"}
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
