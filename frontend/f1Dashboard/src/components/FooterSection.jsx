import React from 'react';

const FooterSection = () => (
  <div className="bg-gray-900 text-white p-2 border-t border-gray-700 flex justify-between items-center text-xs">
    <div className="font-mono">
      [1:15:34] PIT ENTRY: HAMILTON (2.1s stop) | [1:15:32] GAP to VER: +2.1s
    </div>
    <div className="flex items-center space-x-2">
      <span className="text-green-500">●</span>
      <span>WebSocket Connected</span>
      <span>Last Update: 1s ago</span>
    </div>
  </div>
);

export default FooterSection;
