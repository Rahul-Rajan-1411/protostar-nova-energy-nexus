
import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface Project {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  total_solar_capacity: number;
}

const ProjectsMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, location, latitude, longitude, status, total_solar_capacity');
        
        if (error) {
          throw error;
        }

        setProjects(data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load project locations',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    // Load Google Maps script dynamically
    const loadGoogleMapsScript = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      // Define the callback function
      window.initMap = () => {
        if (!mapRef.current) return;
        
        // Create map centered on Pune
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 18.5204, lng: 73.8567 }, // Pune coordinates
          zoom: 11,
          styles: [
            {
              featureType: "administrative",
              elementType: "geometry",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        // Add markers for each project
        projects.forEach((project) => {
          if (project.latitude && project.longitude) {
            const marker = new google.maps.Marker({
              position: { lat: Number(project.latitude), lng: Number(project.longitude) },
              map,
              title: project.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: project.status === 'active' ? '#22c55e' : '#ef4444',
                fillOpacity: 0.9,
                strokeWeight: 1,
                strokeColor: '#ffffff',
              },
            });

            // Add info window for project details
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 8px; font-weight: 600;">${project.name}</h3>
                  <p style="margin: 0 0 5px;">${project.location}</p>
                  <p style="margin: 0 0 5px;">Solar Capacity: ${project.total_solar_capacity} kW</p>
                  <p style="margin: 0; color: ${project.status === 'active' ? '#22c55e' : '#ef4444'};">
                    Status: ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </p>
                </div>
              `,
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
          }
        });
      };
    };

    if (projects.length > 0) {
      // Only load the script once we have projects
      loadGoogleMapsScript();
    }

    return () => {
      // Clean up
      delete window.initMap;
    };
  }, [projects]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-card mt-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Project Locations</h3>
      {loading ? (
        <div className="flex justify-center items-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-md overflow-hidden"
          style={{ backgroundColor: '#f1f5f9' }}
        >
          {projects.length === 0 && (
            <div className="flex justify-center items-center h-full text-gray-500">
              No project locations available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Add initMap to window type
declare global {
  interface Window {
    initMap: () => void;
  }
}

export default ProjectsMap;
