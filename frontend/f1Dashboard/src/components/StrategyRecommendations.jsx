import React from 'react';

const StrategyRecommendations = () => (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        <h3 className="font-bold mb-2 text-white">AI STRATEGY</h3>
        <p className="text-2xl font-bold text-blue-400">"Pit in 2 laps"</p>
        <div className="w-full bg-gray-700 rounded-full h-2.5 my-2">
            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '82%' }}></div>
        </div>
        <p className="text-sm text-gray-400">Confidence: 82%</p>
        <p className="text-xs text-gray-500 mt-1">Rationale: Optimal window for undercut on HAM.</p>
    </div>
);

export default StrategyRecommendations;
