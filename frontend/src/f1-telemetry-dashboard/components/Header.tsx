import React from 'react';

interface HeaderProps {
  lap: number;
  driverName: string;
  trackTemp: number;
}

// Sub-component for the F1 logo SVG
const F1Logo = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 443.5 187.5"
    className="h-8 w-auto" // Scaled appropriately
    fill="#e10600" // Official F1 red
  >
    <path d="M203.4,187.5h62.8v-40.3h40.3V84.4h-40.3V0h-62.8v105.8h-40.3v41.7h40.3V187.5z"></path>
    <path d="M0,187.5l101.7-187.5h62.8L62.8,187.5H0z"></path>
    <path d="M403.4,46.9h-8.5v-8.5h25.5v8.5h-8.5v31.8h-8.5V46.9z M424.3,78.7l-8.5-14.3l-8.5,14.3h-10.2l14.3-22.7v-11.4h8.5v11.4 l14.3,22.7H424.3z"></path>
  </svg>
);

const Header: React.FC<HeaderProps> = ({ lap, driverName, trackTemp }) => {
  return (
    <header className="relative flex justify-between items-center p-4 bg-[#132332] rounded-lg">
      <div className="flex items-center">
        <F1Logo />
        <div className="ml-6">
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider">{driverName}</h1>
        </div>
      </div>

      {/* Centered and larger live indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </span>
        <span className="text-sm font-medium text-red-400 uppercase tracking-wider">Live</span>
      </div>

      <div className="flex space-x-8 text-right items-center">
        <div>
          <p className="text-xs text-gray-400 uppercase">Lap</p>
          <p className="text-3xl font-bold font-mono text-white">{lap}</p>
        </div>
        <div className="h-10 w-px bg-gray-700"></div>
        <div>
          <p className="text-xs text-gray-400 uppercase">Track Temp</p>
          <p className="text-3xl font-bold font-mono text-white">{trackTemp}<span className="text-xl text-gray-400">°C</span></p>
        </div>
      </div>
    </header>
  );
};

export default Header;