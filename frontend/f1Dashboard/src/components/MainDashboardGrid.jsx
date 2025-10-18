import React from 'react';
import RaceStatusPanel from './RaceStatusPanel';
import TelemetryGraph from './TelemetryGraph';
import StrategyRecommendations from './StrategyRecommendations';
import TireDegradationChart from './TireDegradationChart';
import ProbabilityCard from './ProbabilityCard';

const MainDashboardGrid = () => (
  <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <RaceStatusPanel />
    <div className="md:col-span-2 lg:col-span-2">
        <TelemetryGraph />
    </div>
    <StrategyRecommendations />
    <TireDegradationChart />
    <ProbabilityCard />
  </div>
);

export default MainDashboardGrid;
