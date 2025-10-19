import React from 'react';
import { DriverId } from '../types';
import logoUrl from '../assets/Apex Racing Logo.png';

interface HeaderProps {
  driverId: DriverId;
  lap: number;
  onDriverChange: (driverId: DriverId) => void;
}

const DRIVER_OPTIONS: DriverId[] = ['VER', 'HAM', 'LEC', 'NOR'];

const Header: React.FC<HeaderProps> = ({ driverId, lap, onDriverChange }) => {
  return (
    <header className="mb-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img src={logoUrl} alt="Apex Racing logo" className="h-1 w-auto rounded-sm shadow-lg shadow-cyan-500/10" />
        <div>
          <h1 className="text-2xl font-semibold text-white leading-tight">Apex RTSC</h1>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Real-time insights & AI strategy</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <span className="font-mono text-lg text-gray-300">LAP: {lap}</span>
        <div className="flex items-center space-x-2">
           <label htmlFor="driver-select" className="text-sm font-medium text-gray-400">Driver:</label>
           <select 
             id="driver-select"
             value={driverId}
             onChange={(e) => onDriverChange(e.target.value as DriverId)}
             className="bg-[#0d1a26] border border-gray-600 rounded-md p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
           >
             {DRIVER_OPTIONS.map(id => <option key={id} value={id}>{id}</option>)}
           </select>
        </div>
      </div>
    </header>
  );
};

export default Header;
