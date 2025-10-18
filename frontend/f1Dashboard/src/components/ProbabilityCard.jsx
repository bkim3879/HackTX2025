import React from 'react';

const ProbabilityCard = () => (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        <h3 className="font-bold mb-4 text-white">PROBABILITY</h3>
        <div className="text-white">
            <p>Safety Car: <span className="font-mono text-orange-400">15%</span></p>
            <p>Rain: <span className="font-mono text-blue-400">5%</span></p>
        </div>
    </div>
);

export default ProbabilityCard;
