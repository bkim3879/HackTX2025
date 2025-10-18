import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data simulating telemetry over time
const initialData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  speed: 150 + Math.random() * 10,
  throttle: 80 + Math.random() * 20,
  brake: Math.random() > 0.8 ? Math.random() * 100 : 0,
}));

const TelemetryGraph = () => {
  const [data, setData] = React.useState(initialData);

  // Simulate live data updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData.slice(1), {
          time: prevData[prevData.length - 1].time + 1,
          speed: 150 + Math.random() * 50,
          throttle: 70 + Math.random() * 30,
          brake: Math.random() > 0.9 ? Math.random() * 100 : 0,
        }];
        return newData;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700" style={{ height: '400px' }}>
      <h3 className="font-bold mb-4 text-white">LIVE TELEMETRY</h3>
      <div style={{ width: '100%', height: '320px' }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255, 255, 255, 0.5)" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(255, 255, 255, 0.5)" 
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Line 
              type="monotone" 
              dataKey="speed" 
              stroke="#ff3e3e" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
              name="Speed (km/h)"
            />
            <Line 
              type="monotone" 
              dataKey="throttle" 
              stroke="#3eff3e" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
              name="Throttle (%)"
            />
            <Line 
              type="monotone" 
              dataKey="brake" 
              stroke="#ff9f3e" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
              name="Brake Pressure"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryGraph;
