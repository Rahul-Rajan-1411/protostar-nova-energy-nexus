
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Sample data
const data = [
  { name: 'Jan', solar: 0, grid: 0 },
  { name: 'Feb', solar: 0, grid: 0 },
  { name: 'Mar', solar: 0, grid: 0 },
  { name: 'Apr', solar: 0, grid: 0 },
  { name: 'May', solar: 0, grid: 0 },
  { name: 'Jun', solar: 0, grid: 0 },
  { name: 'Jul', solar: 0, grid: 0 },
];

const UsagePattern = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-card h-full">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Global Solar/Grid Usage Pattern</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="solar" stroke="#27ae60" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="grid" stroke="#e74c3c" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsagePattern;
