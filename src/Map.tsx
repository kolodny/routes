import React from 'react';
import { directionsRenderer } from './google';

export const Map: React.FC = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<google.maps.Map | null>(null);

  React.useEffect(() => {
    asyncEffect();
    async function asyncEffect() {
      map.current = new google.maps.Map(ref.current!, {
        center: { lat: 41.11324537782926, lng: -74.044221061934 },
        zoom: 12,
      });
      directionsRenderer.setMap(map.current);
    }
  }, []);

  return <div style={{ height: '100%', width: '100%' }} ref={ref} id="map" />;
};
