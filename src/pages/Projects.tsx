
import React from 'react';
import Header from '@/components/Header';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Building, MapPin, Sun, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
  id: number;
  name: string;
  location: string;
  city: string;
  status: string;
  total_solar_capacity: number;
  image_url: string | null;
  buildings_count: number;
  spdus_count: number;
}

const Projects = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');
        
        if (projectsError) throw projectsError;
        
        if (!projectsData) return [];
        
        // For each project, get the count of buildings and SPDUs
        const projectsWithCounts = await Promise.all(projectsData.map(async (project) => {
          // Get buildings count
          const { count: buildingsCount, error: buildingsError } = await supabase
            .from('buildings')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', project.id);
          
          if (buildingsError) throw buildingsError;
          
          // Get central devices for this project
          const { data: centralDevices, error: centralDevicesError } = await supabase
            .from('central_devices')
            .select('id')
            .eq('project_id', project.id);
          
          if (centralDevicesError) throw centralDevicesError;
          
          // Get SPDUs count across all central devices in this project
          let spdusCount = 0;
          if (centralDevices && centralDevices.length > 0) {
            const centralDeviceIds = centralDevices.map(cd => cd.id);
            const { count: spdusTotal, error: spdusError } = await supabase
              .from('spdus')
              .select('id', { count: 'exact', head: true })
              .in('central_device_id', centralDeviceIds);
            
            if (spdusError) throw spdusError;
            spdusCount = spdusTotal || 0;
          }
          
          return {
            ...project,
            buildings_count: buildingsCount || 0,
            spdus_count: spdusCount
          };
        }));
        
        return projectsWithCounts;
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects',
          variant: 'destructive',
        });
        return [];
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>
          <Button className="bg-green-600 hover:bg-green-700">
            Add New Project
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white h-64 rounded-lg shadow-card animate-pulse" />
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-card overflow-hidden">
                <div 
                  className="h-40 bg-gray-200 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: project.image_url 
                      ? `url(${project.image_url})` 
                      : `url('https://via.placeholder.com/400x200?text=${encodeURIComponent(project.name)}')`
                  }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{project.location || project.city || 'Location not specified'}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                      <Sun className="h-5 w-5 text-yellow-500 mb-1" />
                      <span className="text-xs font-medium">{project.total_solar_capacity || 0} kW</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                      <Building className="h-5 w-5 text-blue-500 mb-1" />
                      <span className="text-xs font-medium">{project.buildings_count} Buildings</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                      <Server className="h-5 w-5 text-purple-500 mb-1" />
                      <span className="text-xs font-medium">{project.spdus_count} SPDUs</span>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">View Details</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-card text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Projects Found</h2>
            <p className="text-gray-600 mb-4">Start by adding your first project using the button above.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;
