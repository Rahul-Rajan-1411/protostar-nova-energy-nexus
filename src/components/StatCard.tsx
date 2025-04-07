
import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  activeCount?: number;
  inactiveCount?: number;
  className?: string;
  consumedValue?: string;
  unusedValue?: string;
  valueUnit?: string;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  activeCount, 
  inactiveCount, 
  className,
  consumedValue,
  unusedValue,
  valueUnit
}: StatCardProps) => {
  return (
    <div className={cn("bg-white p-6 rounded-lg shadow-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        <div className="text-primary">
          {icon}
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <p className="text-4xl font-bold text-gray-900 mb-2">
          {value} 
          {valueUnit && <span className="text-3xl ml-1">{valueUnit}</span>}
        </p>
        
        {(activeCount !== undefined && inactiveCount !== undefined) && (
          <div className="w-full grid grid-cols-2 text-sm">
            <div className="text-center">
              <span className="text-gray-600">Active: </span>
              <span className="font-medium text-green-600">{activeCount}</span>
            </div>
            <div className="text-center">
              <span className="text-gray-600">Inactive: </span>
              <span className="font-medium text-red-500">{inactiveCount}</span>
            </div>
          </div>
        )}

        {(consumedValue && unusedValue) && (
          <div className="w-full grid grid-cols-2 text-sm">
            <div className="text-center">
              <span className="text-gray-600">Consumed: </span>
              <span className="font-medium text-green-600">{consumedValue}</span>
            </div>
            <div className="text-center">
              <span className="text-gray-600">Unused: </span>
              <span className="font-medium text-green-500">{unusedValue}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
