import React from 'react';
import TelemetryGraph from './components/TelemetryGraph';

const TopNavigationBar = () => (
  <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
    <div className="flex items-center space-x-4">
      <span className="text-red-500 font-bold">LIVE</span>
      <span>MONACO GRAND PRIX</span>
      <span>LAP 24/78</span>
      <span>1:15:34.567</span>
      <span>☀️</span>
    </div>
    <div>
      <img src="https://www.formula1.com/etc/designs/fom-website/images/f1_logo.svg" alt="F1 Logo" className="h-6" />
    </div>
  </div>
);

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

const RaceStatusPanel = () => (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        <h3 className="font-bold mb-4 text-white">RACE STATUS: VER</h3>
        <div className="grid grid-cols-2 gap-4 text-white">
            <div>Lap: <span className="font-mono">24/78</span></div>
            <div>Tire: <span className="font-mono text-yellow-400">MEDIUM</span></div>
            <div>Tire Wear: <span className="font-mono text-red-500">68%</span></div>
            <div>Fuel: <span className="font-mono text-green-500">45kg</span></div>
            <div>Speed: <span className="font-mono">198 KPH</span></div>
        </div>
    </div>
);

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

const TireDegradationChart = () => (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        <h3 className="font-bold mb-4 text-white">TIRE DEGRADATION</h3>
        <div className="h-32 bg-gray-800 rounded-lg flex items-center justify-center text-gray-500">
            {/* Placeholder for graph */}
            Graph: Wear vs. Laps
        </div>
    </div>
);

const ProbabilityCard = () => (
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-700">
        <h3 className="font-bold mb-4 text-white">PROBABILITY</h3>
        <div className="text-white">
            <p>Safety Car: <span className="font-mono text-orange-400">15%</span></p>
            <p>Rain: <span className="font-mono text-blue-400">5%</span></p>
        </div>
    </div>
);


const MainDashboardGrid = () => (
  <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
    <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <RaceStatusPanel />
        <TelemetryGraph />
    </div>
     <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <StrategyRecommendations />
        <TireDegradationChart />
        <ProbabilityCard />
    </div>
  </div>
);

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


function App() {
  return (
    <div className="bg-gray-800 min-h-screen flex flex-col font-sans">
      <TopNavigationBar />
      <div className="flex flex-1">
        <LeftSidebar />
        <MainDashboardGrid />
      </div>
      <FooterSection />
    </div>
  );
}

export default App;