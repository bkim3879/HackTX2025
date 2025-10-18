import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Lap 10', wear: 12 },
  { name: 'Lap 20', wear: 25 },
  { name: 'Lap 30', wear: 45 },
  { name: 'Lap 40', wear: 68 },
];

const TireDegradationChart = () => (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        <h3 className="font-bold mb-4 text-white">TIRE DEGRADATION</h3>
        <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wear" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

export default TireDegradationChart;
