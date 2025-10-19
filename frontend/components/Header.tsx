import React from 'react';
import { DriverId } from '../types';
import logoUrl from '../assets/Apex Racing Logo.png';
import { DriverOption } from '../constants/drivers';

interface HeaderProps {
  driverId: DriverId;
  lap: number;
  onDriverChange: (driverId: DriverId) => void;
  driverOptions: DriverOption[];
}

const Header: React.FC<HeaderProps> = ({ driverId, lap, onDriverChange, driverOptions }) => {
  return (
    <header className="mb-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img src={logoUrl} alt="Apex Racing logo" className="h-11 w-auto rounded-sm shadow-lg shadow-cyan-500/10" />
        <div>
          <h1 className="text-2xl font-semibold text-white leading-tight">Apex RTSC</h1>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Real-time insights & AI strategy</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className="font-mono text-sm text-gray-300 bg-white/5 rounded px-3 py-1">Lap {lap}</span>
        <div className="flex items-center space-x-2 text-sm">
           <label htmlFor="driver-select" className="text-sm font-medium text-gray-400">Driver:</label>
          <select 
             id="driver-select"
             value={driverId}
             onChange={(e) => onDriverChange(e.target.value as DriverId)}
             className="bg-[#0d1a26] border border-gray-600 rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
           >
             {driverOptions.map(option => (
               <option key={option.value} value={option.value}>
                 {option.label}
               </option>
             ))}
           </select>
        </div>
      </div>
    </header>
  );
};

export default Header;
