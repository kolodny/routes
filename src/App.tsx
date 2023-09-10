import React from 'react';
import { Map } from './Map';
import { calculateAndDisplayRoute } from './google';

export const App: React.FC = () => {
  const [directions, setDirections] = React.useState('');
  const [info, setInfo] = React.useState('');
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
      }}
    >
      <div style={{ display: 'flex', width: '100%' }}>
        <textarea
          defaultValue={localStorage.getItem('addresses') || ''}
          onChange={(e) => {
            localStorage.setItem('addresses', e.target.value);
          }}
          style={{ width: '50%', padding: 8 }}
          rows={10}
          placeholder=" Enter Addresses..."
        ></textarea>
        <div
          style={{
            height: 200,
            overflow: 'scroll',
            width: '50%',
            padding: 8,
            border: '1px solid transparent',
          }}
          dangerouslySetInnerHTML={{ __html: directions || 'Directions...' }}
        ></div>
      </div>
      <div style={{ padding: 8 }}>
        {/* <label>
          Arriving at:
          <input
            type="datetime-local"
            defaultValue={localStorage.getItem('date') || ''}
            onChange={(e) => localStorage.setItem('date', e.target.value)}
          />
        </label> */}
        <button
          style={{ height: 30, margin: 10 }}
          onClick={async () => {
            const addresses = localStorage
              .getItem('addresses')
              ?.trim()
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean);
            if (!addresses || addresses.length < 3) {
              alert('Please enter at least 3 addresses');
              return;
            }
            const start = addresses.shift()!;
            const end = addresses.pop()!;

            const directions = await calculateAndDisplayRoute({
              start,
              end,
              targetTime: new Date(localStorage.getItem('date') || Date.now()),
              waypoints: addresses,
            });
            setDirections(directions.instructions.join('<br />'));
            setInfo(
              `Total time: ${(directions.totalTime / 60).toFixed(
                2
              )} minutes, total distance: ${(
                directions.totalDistance * 0.0006
              ).toFixed(2)} miles`
            );
          }}
        >
          Calculate!
        </button>
        {info && <span style={{ padding: 8 }}>Route info: {info}</span>}
      </div>

      <div style={{ flexGrow: 1 }}>
        <Map />
      </div>
    </div>
  );
};
