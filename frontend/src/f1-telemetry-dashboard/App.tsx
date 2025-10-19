import React, { useState, useEffect, useRef } from 'react';
import { TelemetryData, AdvancedAIPredictionsData } from './types';
import { getInitialData, updateTelemetryData, makeCsvIterator, setCsvIterator } from './services/telemetryService';
import loadCsvRows from './services/csvLoader';
import TelemetryGrid from './components/TelemetryGrid';
import AIPredictions from './components/AIPredictions';
import Header from './components/Header';
import LiveChat from './components/LiveChat'
// The new sample data provided by the user
const sampleAIPredictionData: AdvancedAIPredictionsData = {
  "lap": 32,
  "predictedLapTime": 95.8,
  "paceVariance": 0.21,
  "degradationSlope": 0.03,
  "eventProbabilities": {"rainNext3": 0.15, "safetyCarNext3": 0.06},
  "strategyCandidates": [
    {"action": "pit_now_soft", "mu": -5.0, "sigma": 1.6, "conf": 0.77},
    {"action": "pit_in_2_soft", "mu": -6.2, "sigma": 1.9, "conf": 0.82},
    {"action": "stay_3_laps", "mu": 2.8, "sigma": 2.2, "conf": 0.41}
  ],
  "bestAction": "pit_in_2_soft",
  "expectedTimeGain": 6.2,
  "confidence": 0.82,
  "rationaleTags": ["degradation_up", "clean_air"],
  "modelMeta": {"version": "rtsc_1.0.3", "updateTimeMs": 48}
};

const App: React.FC = () => {
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'ai' | 'liveChat'>('telemetry');

  // State lifted up from AIPredictions, now using the advanced type
  const [predictions, setPredictions] = useState<AdvancedAIPredictionsData | null>(null);
  const [isAILoading, setIsAILoading] = useState<boolean>(true);
  const [aiError, setAIError] = useState<string | null>(null);
  const [liveChatError, setLiveChatError] = useState<string | null>(null);

  
  // Effect for live telemetry simulation
  useEffect(() => {
    let mounted = true;
    (async () => {
      const initialData = getInitialData();
      setTelemetryData(initialData);

      // Load CSV rows and initialize iterator so telemetry updates come from CSV
      try {
        // path relative to this file's location; ../data/combined_race.csv resolves to frontend/src/data/combined_race.csv
        const rows = await loadCsvRows('../data/combined_race.csv');
        if (rows && rows.length > 0) {
          const it = makeCsvIterator(rows);
          setCsvIterator(it);
        }
      } catch (err) {
        // If CSV fails to load, fall back to generated telemetry
        console.warn('CSV load failed, falling back to simulated telemetry:', err);
      }

      const interval = setInterval(() => {
        setTelemetryData(prevData => {
          const newData = prevData ? updateTelemetryData(prevData) : getInitialData();
          return newData;
        });
      }, 200);

      if (!mounted) clearInterval(interval);
    })();

    return () => { setCsvIterator(null); };
  }, []);

  // Effect for fetching AI predictions using the sample data
  useEffect(() => {
    const fetchMockPredictions = () => {
      setIsAILoading(true);
      // Simulate network delay
      setTimeout(() => {
        // In a real app, you would handle potential errors here
        const updatedSample = {...sampleAIPredictionData, lap: sampleAIPredictionData.lap + Math.floor(Date.now() / 60000) % 10};
        setPredictions(updatedSample);
        setAIError(null);
        setIsAILoading(false);
      }, 1000);
    };
    
    fetchMockPredictions(); // Fetch immediately on mount
    const intervalId = setInterval(fetchMockPredictions, 60000); // Refresh mock data every 60 seconds

    return () => clearInterval(intervalId);
  }, []); 

  const TabButton: React.FC<{
    label: string;
    tabName: 'telemetry' | 'ai' | 'liveChat';
  }> = ({ label, tabName }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tabName
          ? 'bg-cyan-500 text-white'
          : 'text-gray-300 hover:bg-[#132332]'
      }`}
    >
      {label}
    </button>
  );

  if (!telemetryData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading Telemetry Data...
      </div>
    );
  }

  return (
    <main className="p-4 font-sans text-gray-200">
      <Header 
        lap={predictions?.lap ?? telemetryData.positionStrategy1.stintLength} 
        driverName={telemetryData.driverInputs.driver}
        trackTemp={telemetryData.trackTemp}
      />
      <div className="my-4 flex space-x-2 p-1 bg-[#0d1a26] rounded-lg">
        <TabButton label="Live Telemetry" tabName="telemetry" />
        <TabButton label="AI Predictions" tabName="ai" />
        <TabButton label= "Live Chat" tabName="liveChat" />
      </div>

      <div className={activeTab === 'telemetry' ? '' : 'hidden'}>
        <TelemetryGrid data={telemetryData} />
      </div>
      <div className={activeTab === 'ai' ? '' : 'hidden'}>
          <AIPredictions predictions={predictions} isLoading={isAILoading} error={aiError} />
        </div>

        {/* Live Chat tab panel - only shown when activeTab === 'liveChat' */}
        <div className={activeTab === 'liveChat' ? '' : 'hidden'}>
          <div className="min-h-screen flex items-center justify-center bg-black">
            <LiveChat />
          </div>
        </div>
   
    </main>
  );
};

export default App;