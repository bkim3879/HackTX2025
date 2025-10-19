import React from 'react';
import { AdvancedAIPredictionsData, StrategyCandidate } from '../types';
import DashboardPanel from './DashboardPanel';

interface AIPredictionsProps {
  predictions: AdvancedAIPredictionsData;
}

const AnalyticsDataPoint: React.FC<{ label: string; value: string | number; subValue?: string; unit?: string }> = ({ label, value, subValue, unit }) => (
    <div className="flex justify-between items-start py-1.5 border-b border-white/5 last:border-b-0">
        <span className="text-sm text-gray-300">{label}</span>
        <div className="text-right">
            <p className="font-mono text-lg font-medium text-white">
                {value}
                {unit && <span className="text-base text-gray-400 ml-1">{unit}</span>}
            </p>
            {subValue && <p className="text-xs text-gray-500 -mt-1">{subValue}</p>}
        </div>
    </div>
);

const StrategyCandidateRow: React.FC<{ candidate: StrategyCandidate, isBest: boolean }> = ({ candidate, isBest }) => (
    <div className={`grid grid-cols-4 gap-4 items-center text-sm py-2 px-3 ${isBest ? 'bg-cyan-500/10 rounded-md' : ''}`}>
        <span className="font-semibold">
            {candidate.action.replace(/_/g, ' ')}
        </span>
        <span className={`font-mono text-right ${candidate.mu < 0 ? 'text-green-400' : 'text-red-400'}`}>
            {candidate.mu.toFixed(2)}s
        </span>
        <span className="font-mono text-right text-gray-400">
            &plusmn;{candidate.sigma.toFixed(2)}s
        </span>
        <span className="font-mono text-right">
            {(candidate.conf * 100).toFixed(0)}%
        </span>
    </div>
);


const AIPredictions: React.FC<AIPredictionsProps> = ({ predictions }) => {
    const { 
        lap,
        bestAction, 
        expectedTimeGain, 
        confidence, 
        rationaleTags, 
        predictedLapTime,
        paceVariance,
        degradationSlope,
        eventProbabilities,
        modelMeta,
        strategyCandidates 
      } = predictions;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardPanel title={`Optimal Strategy & Candidates - Lap ${lap}`} className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center py-4">
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-sm text-gray-400 mb-1">Expected Time Gain</p>
                        <p className="text-5xl font-bold text-green-400">{expectedTimeGain.toFixed(2)}s</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-sm text-gray-400 mb-1">Best Action</p>
                        <p className="text-3xl font-bold text-cyan-400">{bestAction.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-sm text-gray-400 mb-1">Confidence</p>
                        <p className="text-5xl font-bold">{Math.round(confidence * 100)}%</p>
                    </div>
                </div>
                 <div className="border-t border-white/10 mt-4 pt-4">
                  <p className="text-sm text-gray-400 mb-2">Rationale</p>
                  <div className="flex flex-wrap gap-2">
                    {rationaleTags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2.5 py-1 rounded-full">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/10 mt-4 pt-4">
                     <div className="grid grid-cols-4 gap-4 text-xs text-gray-400 uppercase tracking-wider px-3 pb-2 border-b border-white/10">
                        <span>Action</span>
                        <span className="text-right">Gain / Loss (µ)</span>
                        <span className="text-right">Risk (σ)</span>
                        <span className="text-right">Confidence</span>
                    </div>
                    <div>
                        {strategyCandidates.map((c, i) => (
                            <StrategyCandidateRow key={i} candidate={c} isBest={c.action === bestAction} />
                        ))}
                    </div>
                </div>
            </DashboardPanel>
            
            <DashboardPanel title="Predictive Analytics" className="lg:col-span-1">
                <div className="space-y-1">
                    <AnalyticsDataPoint label="Predicted Lap Time" value={predictedLapTime.toFixed(2)} unit="s" />
                    <AnalyticsDataPoint label="Pace Variance" value={`±${paceVariance.toFixed(2)}`} unit="s" />
                    <AnalyticsDataPoint label="Tire Degradation" value={degradationSlope.toFixed(2)} unit="s / lap" />
                    <AnalyticsDataPoint 
                        label="Rain Probability" 
                        value={`${(eventProbabilities.rainNext3 * 100).toFixed(0)}%`}
                        subValue={eventProbabilities.rainLapEstimate ? `est. Lap ${eventProbabilities.rainLapEstimate}` : "in next 3 laps"}
                    />
                    <AnalyticsDataPoint 
                        label="Safety Car Prob."
                        value={`${(eventProbabilities.safetyCarNext3 * 100).toFixed(0)}%`}
                        subValue={eventProbabilities.safetyCarLapEstimate ? `est. Lap ${eventProbabilities.safetyCarLapEstimate}` : "in next 3 laps"}
                    />
                    <div className="pt-2">
                        <AnalyticsDataPoint label="Model Version" value={modelMeta.version} />
                        <AnalyticsDataPoint label="Latency" value={modelMeta.updateTimeMs} unit="ms" />
                    </div>
                </div>
            </DashboardPanel>
        </div>
    );
};

export default AIPredictions;