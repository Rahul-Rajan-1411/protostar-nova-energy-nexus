
import React from 'react';
import Header from '@/components/Header';

const Projects = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Projects</h1>
        <p className="text-gray-600">Projects will be displayed here.</p>
      </main>
    </div>
  );
};

export default Projects;
