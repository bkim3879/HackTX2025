import React from 'react';

const RaceStatusPanel = () => (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        <h3 className="font-bold mb-4 text-white">RACE STATUS: VER</h3>
        <div className="grid grid-cols-2 gap-4 text-white">
            <div>Lap: <span className="font-mono">24/78</span></div>
            <div>Tire: <span className="font-mono text-yellow-400">MEDIUM</span></div>
            <div>Tire Wear: <span className="font-mono text-red-500">68%</span></div>
            <div>Fuel: <span className="font-mono text-green-500">45kg</span></div>
            <div>Speed: <span className="font-mono">198 KPH</span></div>
        </div>
    </div>
);

export default RaceStatusPanel;
