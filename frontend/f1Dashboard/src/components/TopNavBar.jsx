import React, { useState, useEffect } from 'react';

const TopNavBar = () => {
  const [timer, setTimer] = useState('1:23:45.678');

  // Fake timer update
  useEffect(() => {
    const interval = setInterval(() => {
      // This is just a dummy update, not a real timer
      const newTime = new Date().toISOString().substr(11, 12);
      setTimer(newTime);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bg-[#0f1117] text-yellow-300 p-3 flex justify-between items-center shadow-lg z-50">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <span className="font-bold text-lg animate-pulse">LIVE</span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 rounded-full blur-xl opacity-70"></div>
        </div>
        <h1 className="text-xl font-bold">F1 2025 Qatar GP</h1>
      </div>
      <div className="flex items-center space-x-6 font-mono text-lg">
        <span>Lap 53/57</span>
        <span>{timer}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-2xl">☀️</span>
        <span className="font-medium">Clear</span>
      </div>
    </div>
  );
};

export default TopNavBar;
