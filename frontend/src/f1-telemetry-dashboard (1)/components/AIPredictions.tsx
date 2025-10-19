
import React from 'react';
import { AdvancedAIPredictionsData, StrategyCandidate } from '../types';
import DashboardPanel from './DashboardPanel';
import DataPoint from './DataPoint';

interface AIPredictionsProps {
  predictions: AdvancedAIPredictionsData | null;
  isLoading: boolean;
  error: string | null;
}

const AIPredictions: React.FC<AIPredictionsProps> = ({ predictions, isLoading, error }) => {
  const LoadingState = () => (
    <div className="flex items-center justify-center h-full text-gray-400">
      <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          <span>Analyzing race data...</span>
      </div>
    </div>
  );

  const RationaleTag: React.FC<{ tag: string }> = ({ tag }) => (
    <span className="bg-gray-700 text-cyan-300 text-xs font-medium px-2.5 py-1 rounded-full">
      {tag.replace(/_/g, ' ').toUpperCase()}
    </span>
  );

  const StrategyCandidateRow: React.FC<{ candidate: StrategyCandidate, isBest: boolean }> = ({ candidate, isBest }) => (
    <div className={`grid grid-cols-4 gap-4 p-2 rounded-md ${isBest ? 'bg-cyan-900/50' : ''}`}>
      <span className={`font-medium ${isBest ? 'text-cyan-400' : 'text-white'}`}>{candidate.action.replace(/_/g, ' ')}</span>
      <span className={`font-mono ${candidate.mu < 0 ? 'text-green-400' : 'text-red-400'}`}>{candidate.mu.toFixed(2)}s</span>
      <span className="font-mono text-gray-400">±{candidate.sigma.toFixed(2)}s</span>
      <span className="font-mono text-gray-300">{(candidate.conf * 100).toFixed(0)}%</span>
    </div>
  );

  const PredictionContent = () => {
    if (isLoading && !predictions) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><DashboardPanel title="Optimal Strategy" className="lg:col-span-3 h-64"><LoadingState /></DashboardPanel></div>;
    if (error) return <div className="text-center text-red-400 p-4">{error}</div>;
    if (!predictions) return <div className="text-center text-gray-400 p-4">Awaiting first AI prediction...</div>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        
        {/* Main Recommendation */}
        <DashboardPanel title={`Optimal Strategy - Lap ${predictions.lap}`} className="lg:col-span-2">
            <div className="flex flex-col justify-between h-full">
              <div className="text-center">
                  <p className="text-gray-400 text-sm uppercase tracking-wider">Best Action</p>
                  <p className="text-3xl font-bold text-cyan-400 my-2">{predictions.bestAction.replace(/_/g, ' ')}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center my-4">
                  <div>
                      <p className="text-gray-400 text-sm uppercase tracking-wider">Expected Time Gain</p>
                      <p className="text-4xl font-mono font-bold text-green-400 mt-1">{predictions.expectedTimeGain.toFixed(2)}s</p>
                  </div>
                   <div>
                      <p className="text-gray-400 text-sm uppercase tracking-wider">Confidence</p>
                      <p className="text-4xl font-mono font-bold text-white mt-1">{(predictions.confidence * 100).toFixed(0)}%</p>
                  </div>
              </div>
              <div className="text-center border-t border-gray-700 pt-3">
                  <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Rationale</p>
                  <div className="flex justify-center items-center gap-2">
                      {predictions.rationaleTags.map(tag => <RationaleTag key={tag} tag={tag} />)}
                  </div>
              </div>
            </div>
        </DashboardPanel>
        
        {/* Predictive Analytics */}
        <DashboardPanel title="Predictive Analytics">
            <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                    <DataPoint label="Predicted Lap Time" value={predictions.predictedLapTime.toFixed(2)} unit="s" />
                    <DataPoint label="Pace Variance" value={`±${predictions.paceVariance.toFixed(2)}`} unit="s" />
                    <DataPoint label="Tire Degradation" value={`${predictions.degradationSlope.toFixed(2)}s`} unit="/ lap" />
                    <div className="pt-2 border-t border-gray-700">
                        <DataPoint label="Rain Probability" value={(predictions.eventProbabilities.rainNext3 * 100).toFixed(0)} unit="%" containerClassName="mt-2" />
                        <p className="text-xs text-right text-gray-500 -mt-1">in next 3 laps</p>
                    </div>
                    <div>
                      <DataPoint label="Safety Car Prob." value={(predictions.eventProbabilities.safetyCarNext3 * 100).toFixed(0)} unit="%" />
                      <p className="text-xs text-right text-gray-500 -mt-1">in next 3 laps</p>
                    </div>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-700">
                    <DataPoint label="Model Version" value={`v${predictions.modelMeta.version}`} valueClassName="text-lg"/>
                    <DataPoint label="Latency" value={predictions.modelMeta.updateTimeMs} unit="ms" valueClassName="text-lg" />
                </div>
            </div>
        </DashboardPanel>

        {/* Strategy Candidates */}
        <DashboardPanel title="Strategy Candidates" className="lg:col-span-3">
            <div className="flex flex-col">
                <div className="grid grid-cols-4 gap-4 px-2 pb-2 border-b border-gray-700 text-sm text-gray-400">
                    <span>Action</span>
                    <span>Gain / Loss (μ)</span>
                    <span>Risk (σ)</span>
                    <span>Confidence</span>
                </div>
                <div className="space-y-1 mt-2">
                    {predictions.strategyCandidates
                        .sort((a, b) => b.conf - a.conf) // Sort by confidence
                        .map(candidate => (
                            <StrategyCandidateRow 
                                key={candidate.action} 
                                candidate={candidate} 
                                isBest={candidate.action === predictions.bestAction}
                            />
                    ))}
                </div>
            </div>
        </DashboardPanel>
      </div>
    )
  }

  return <PredictionContent />;
};

export default AIPredictions;