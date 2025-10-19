import React from 'react';
import { AdvancedAIPredictionsData, StrategyCandidate } from '../types';
import DashboardPanel from './DashboardPanel';
import DataPoint from './DataPoint';

interface AIPredictionsProps {
  predictions: AdvancedAIPredictionsData;
}

const getActionColor = (action: string) => {
    if (action.includes('PIT')) return 'bg-red-500/20 text-red-300';
    if (action.includes('EXTEND')) return 'bg-yellow-500/20 text-yellow-300';
    if (action.includes('MAINTAIN')) return 'bg-green-500/20 text-green-300';
    return 'bg-gray-500/20 text-gray-300';
}

const StrategyCandidateRow: React.FC<{ candidate: StrategyCandidate }> = ({ candidate }) => (
    <div className="grid grid-cols-3 gap-2 items-center text-xs py-1.5 px-2 rounded-md bg-white/5">
        <span className={`font-semibold truncate ${getActionColor(candidate.action)} px-2 py-0.5 rounded-full text-center`}>
            {candidate.action.replace('_', ' ')}
        </span>
        <span className="font-mono text-right">{(-candidate.mu).toFixed(2)}s gain</span>
        <span className="font-mono text-right">{(candidate.conf * 100).toFixed(0)}% conf.</span>
    </div>
);

const AIPredictions: React.FC<AIPredictionsProps> = ({ predictions }) => {
  const { 
    bestAction, 
    expectedTimeGain, 
    confidence, 
    rationaleTags, 
    predictedLapTime, 
    eventProbabilities,
    strategyCandidates 
  } = predictions;

  return (
    <DashboardPanel title="AI Strategy Predictions">
      <div className="flex flex-col h-full">
        <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">Best Action</p>
            <h3 className={`text-xl font-bold ${getActionColor(bestAction)} w-fit px-3 py-1 rounded-md`}>
                {bestAction.replace('_', ' ')}
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-x-4">
                <DataPoint label="Time Gain" value={expectedTimeGain.toFixed(3)} unit="s" containerClassName="text-sm" valueClassName="text-lg" />
                <DataPoint label="Confidence" value={`${(confidence * 100).toFixed(1)}%`} containerClassName="text-sm" valueClassName="text-lg" />
            </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Rationale</p>
          <div className="flex flex-wrap gap-1.5">
            {rationaleTags.map(tag => (
              <span key={tag} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                {tag.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mb-4 flex-grow">
          <p className="text-xs text-gray-400 mb-2">Strategy Candidates</p>
          <div className="space-y-1.5">
            {strategyCandidates.map(c => <StrategyCandidateRow key={c.action} candidate={c} />)}
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
            <DataPoint label="Predicted Lap Time" value={predictedLapTime.toFixed(3)} unit="s" containerClassName="text-xs" valueClassName="text-base"/>
            <DataPoint label="P(Safety Car)" value={`${(eventProbabilities.safetyCarNext3 * 100).toFixed(0)}%`} containerClassName="text-xs" valueClassName="text-base"/>
            <DataPoint label="P(Rain)" value={`${(eventProbabilities.rainNext3 * 100).toFixed(0)}%`} containerClassName="text-xs" valueClassName="text-base"/>
        </div>
      </div>
    </DashboardPanel>
  );
};

export default AIPredictions;
