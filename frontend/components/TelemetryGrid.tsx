import React from 'react';
import { RecommendationDTO, TelemetryTickDTO } from '../types';
import DashboardPanel from './DashboardPanel';
import DataPoint from './DataPoint';

const toLapTime = (pace: number | null) => {
  if (pace === null || pace === undefined) return '--:--.---';
  const minutes = Math.floor(pace / 60);
  const seconds = pace - minutes * 60;
  return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const formatProbability = (value: number | null) => {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value * 100)}%`;
};

const formatGap = (value: number | null) => {
  if (value === null || value === undefined) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}s`;
};

const formatNumber = (value: number | null, unit?: string) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(2)}${unit ?? ''}`;
};

interface TelemetryGridProps {
  telemetry: TelemetryTickDTO | null;
  recommendation: RecommendationDTO | null;
  driverLabelMap: Record<string, string>;
}

const TelemetryGrid: React.FC<TelemetryGridProps> = ({
  telemetry,
  recommendation,
  driverLabelMap,
}) => {
  if (!telemetry) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#132332] p-6 text-center text-gray-400">
        Waiting for telemetry data...
      </div>
    );
  }

  const best = recommendation?.best;
  const driverLabel = driverLabelMap[telemetry.driverId] ?? telemetry.driverId;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-5">
      <DashboardPanel title="Session Overview">
        <div className="space-y-2">
          <DataPoint label="Driver" value={driverLabel} />
          <DataPoint label="Lap" value={telemetry.lap} />
          <DataPoint label="Position" value={telemetry.position ?? 'N/A'} />
          <DataPoint label="Compound" value={telemetry.compound} />
          <DataPoint label="Stint Age" value={telemetry.stintAge} unit="laps" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Pace & Gaps">
        <div className="space-y-2">
          <DataPoint label="Lap Pace" value={toLapTime(telemetry.pace)} />
          <DataPoint label="Gap Front" value={formatGap(telemetry.gapFront)} />
          <DataPoint label="Gap Back" value={formatGap(telemetry.gapBack)} />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Tyre & Fuel">
        <div className="space-y-2">
          <DataPoint label="Tyre Wear" value={telemetry.tireWear !== null && telemetry.tireWear !== undefined ? `${(telemetry.tireWear * 100).toFixed(1)}%` : 'N/A'} />
          <DataPoint label="Fuel Load" value={formatNumber(telemetry.fuel, ' kg')} />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Track Conditions">
        <div className="space-y-2">
          <DataPoint label="Track Temp" value={formatNumber(telemetry.trackTemp, ' °C')} />
          <DataPoint label="Rain Probability" value={formatProbability(telemetry.rainProb)} />
          <DataPoint label="Safety Car Probability" value={formatProbability(telemetry.scProb)} />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Strategy Snapshot" className="xl:col-span-2">
        {best ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-3">
              <p className="text-[0.65rem] uppercase tracking-wider text-cyan-100/70">Recommended</p>
              <p className="font-mono text-2xl font-semibold text-white">
                {best.action.replace(/_/g, ' ').toUpperCase()}
              </p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Expected Gain</p>
                  <p className={`font-mono text-lg ${best.mu < 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {best.mu.toFixed(2)}s
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Risk (σ)</p>
                  <p className="font-mono text-lg text-white">{best.sigma.toFixed(2)}s</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Confidence</p>
                  <p className="font-mono text-lg text-white">
                    {best.conf !== undefined && best.conf !== null ? `${Math.round(best.conf * 100)}%` : 'N/A'}
                  </p>
                </div>
              </div>
              {best.reasons && best.reasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {best.reasons.map((reason) => (
                    <span key={reason} className="text-xs bg-white/10 text-gray-200 px-2.5 py-1 rounded-full">
                      {reason.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {recommendation?.alts?.length ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-gray-400">Alternatives</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {recommendation.alts.map((alt) => (
                    <div key={alt.action} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      <p className="font-semibold text-white">{alt.action.replace(/_/g, ' ')}</p>
                      <p className={`font-mono text-sm ${alt.mu < 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {alt.mu.toFixed(2)}s
                      </p>
                      <p className="text-xs text-gray-400">σ {alt.sigma.toFixed(2)}s</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-t border-white/10 pt-3 flex justify-between text-[0.65rem] uppercase tracking-widest text-gray-400">
              <span>Model {recommendation?.model.version ?? 'N/A'}</span>
              <span>{recommendation?.model.latencyMs ?? '--'} ms</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Waiting for recommendation...</p>
        )}
      </DashboardPanel>
    </div>
  );
};

export default TelemetryGrid;
