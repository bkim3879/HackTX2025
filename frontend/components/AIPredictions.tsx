import React from 'react';
import { RecommendationDTO, TelemetryTickDTO } from '../types';
import DashboardPanel from './DashboardPanel';
import DataPoint from './DataPoint';

interface AIPredictionsProps {
  recommendation: RecommendationDTO | null;
  telemetry: TelemetryTickDTO | null;
  driverLabelMap: Record<string, string>;
}

const toLapTime = (pace: number | null) => {
  if (pace === null || pace === undefined) return '--:--.---';
  const minutes = Math.floor(pace / 60);
  const seconds = pace - minutes * 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
};

const AIPredictions: React.FC<AIPredictionsProps> = ({ recommendation, telemetry, driverLabelMap }) => {
  if (!recommendation) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#132332] p-6 text-center text-gray-400">
        Waiting for recommendation data...
      </div>
    );
  }

  const best = recommendation.best;
  const driverLabel = telemetry ? driverLabelMap[telemetry.driverId] ?? telemetry.driverId : 'N/A';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <DashboardPanel title="Primary Recommendation">
        <div className="space-y-4">
          <div className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-3">
            <p className="text-[0.65rem] uppercase tracking-wider text-cyan-100/70">Recommended Action</p>
            <p className="font-mono text-3xl font-semibold text-white">
              {best.action.replace(/_/g, ' ').toUpperCase()}
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DataPoint
                label="Expected Gain"
                value={best.mu.toFixed(2)}
                unit="s"
                valueClassName={best.mu < 0 ? 'text-green-400' : 'text-red-400'}
                labelClassName="text-xs uppercase tracking-wider text-gray-400"
              />
              <DataPoint
                label="Risk (σ)"
                value={best.sigma.toFixed(2)}
                unit="s"
                labelClassName="text-xs uppercase tracking-wider text-gray-400"
              />
              <DataPoint
                label="Confidence"
                value={
                  best.conf !== undefined && best.conf !== null
                    ? `${Math.round(best.conf * 100)}`
                    : 'N/A'
                }
                unit={best.conf !== undefined && best.conf !== null ? '%' : undefined}
                labelClassName="text-xs uppercase tracking-wider text-gray-400"
              />
            </div>
            {best.reasons && best.reasons.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {best.reasons.map((reason) => (
                  <span key={reason} className="text-xs bg-white/10 text-gray-200 px-2.5 py-1 rounded-full">
                    {reason.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-3 flex justify-between text-[0.65rem] uppercase tracking-widest text-gray-400">
            <span>Model {recommendation.model.version}</span>
            <span>{recommendation.model.latencyMs} ms</span>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Session Context">
        <div className="space-y-3">
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs uppercase tracking-wider text-gray-400">Lap Pace</p>
            <p className="font-mono text-lg text-white">{toLapTime(telemetry?.pace ?? null)}</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs uppercase tracking-wider text-gray-400">Driver</p>
            <p className="font-mono text-lg text-white">{driverLabel}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">Rain Probability</p>
              <p className="font-mono text-lg text-white">{formatPercent(telemetry?.rainProb)}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-400">Safety Car Probability</p>
              <p className="font-mono text-lg text-white">{formatPercent(telemetry?.scProb)}</p>
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <p className="text-xs uppercase tracking-wider text-gray-400">Tyre Wear</p>
            <p className="font-mono text-lg text-white">
              {telemetry?.tireWear !== undefined && telemetry?.tireWear !== null
                ? `${(telemetry.tireWear * 100).toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>
        </div>
      </DashboardPanel>

      {recommendation.alts.length > 0 && (
        <DashboardPanel title="Alternative Strategies" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="py-2">Action</th>
                  <th className="py-2 text-right">μ (s)</th>
                  <th className="py-2 text-right">σ (s)</th>
                  <th className="py-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recommendation.alts.map((alt) => (
                  <tr key={alt.action} className="border-b border-white/5 last:border-b-0">
                    <td className="py-2">{alt.action.replace(/_/g, ' ')}</td>
                    <td className={`py-2 text-right font-mono ${alt.mu < 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {alt.mu.toFixed(2)}
                    </td>
                    <td className="py-2 text-right font-mono text-white">{alt.sigma.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono text-white">
                      {alt.conf !== undefined && alt.conf !== null ? `${Math.round(alt.conf * 100)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
      )}
    </div>
  );
};

export default AIPredictions;
