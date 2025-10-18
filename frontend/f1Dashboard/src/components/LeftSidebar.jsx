import React from 'react';

const LeftSidebar = () => (
  <div className="bg-gray-900 text-white p-4 border-r border-gray-700 w-64">
    <h2 className="font-bold mb-4">DRIVERS</h2>
    <ul>
      <li className="flex justify-between items-center p-2 rounded-lg bg-gray-800">
        <span>1. VER</span>
        <span className="text-green-500">-0.000</span>
      </li>
      <li className="flex justify-between items-center p-2 rounded-lg">
        <span>2. HAM</span>
        <span>+2.345</span>
      </li>
      <li className="flex justify-between items-center p-2 rounded-lg">
        <span>3. LEC</span>
        <span>+5.123</span>
      </li>
    </ul>
    <h2 className="font-bold mt-8 mb-4">FILTERS</h2>
    <div className="space-y-2">
      <button className="w-full text-left p-2 rounded-lg bg-gray-800">Tire Compound</button>
      <button className="w-full text-left p-2 rounded-lg hover:bg-gray-800">Stint Length</button>
      <button className="w-full text-left p-2 rounded-lg hover:bg-gray-800">Pit History</button>
    </div>
  </div>
);

export default LeftSidebar;
