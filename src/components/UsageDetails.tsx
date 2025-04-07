
import React from 'react';

interface UsageDetailRowProps {
  label: string;
  value: string;
  color: string;
}

const UsageDetailRow = ({ label, value, color }: UsageDetailRowProps) => {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${color} mr-3`}></div>
        <span className="text-gray-700">{label}</span>
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
};

const UsageDetails = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-card h-full">
      <h3 className="text-lg font-medium text-gray-700 mb-6">Global Solar/Grid Usage Details</h3>
      
      <div className="space-y-2">
        <UsageDetailRow 
          label="Solar Power: Generated" 
          value="0.00 MWh" 
          color="bg-green-600" 
        />
        
        <UsageDetailRow 
          label="Solar Power: Consumed" 
          value="0.00 MWh" 
          color="bg-green-600" 
        />
        
        <UsageDetailRow 
          label="Solar Power: Distributed" 
          value="0.00 MWh" 
          color="bg-green-500" 
        />
        
        <UsageDetailRow 
          label="Solar Power: Common Utilities" 
          value="0.00 MWh" 
          color="bg-yellow-500" 
        />
        
        <UsageDetailRow 
          label="Solar Power: Unused" 
          value="0.00 MWh" 
          color="bg-orange-500" 
        />
        
        <UsageDetailRow 
          label="Grid Power consumed" 
          value="0.00 MWh" 
          color="bg-red-500" 
        />
      </div>
    </div>
  );
};

export default UsageDetails;
