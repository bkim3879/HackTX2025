
import React from 'react';

interface DashboardPanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-[#132332] rounded-lg p-4 flex flex-col shadow-md ${className}`}>
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      <div className="flex-grow flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default DashboardPanel;
