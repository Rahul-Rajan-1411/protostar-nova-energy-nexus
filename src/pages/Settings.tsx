
import React from 'react';
import Header from '@/components/Header';

const Settings = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <p className="text-gray-600">System settings will be available here.</p>
      </main>
    </div>
  );
};

export default Settings;
