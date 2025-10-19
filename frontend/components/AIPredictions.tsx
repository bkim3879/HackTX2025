import React from 'react';
import { AdvancedAIPredictionsData, StrategyCandidate, TelemetryData, PaceSample } from '../types';
import DashboardPanel from './DashboardPanel';

interface AIPredictionsProps {
  predictions: AdvancedAIPredictionsData;
  telemetry: TelemetryData;
  paceHistory: PaceSample[];
  gapPerSectorChange: number | null;
}

const AnalyticsDataPoint: React.FC<{
    label: string;
    value: string | number;
    subValue?: string;
    unit?: string;
    valueClassName?: string;
    labelClassName?: string;
}> = ({ label, value, subValue, unit, valueClassName = '', labelClassName = '' }) => (
    <div className="flex justify-between items-start py-1.5 border-b border-white/5 last:border-b-0">
        <span className={`text-sm text-gray-300 ${labelClassName}`.trim()}>{label}</span>
        <div className="text-right">
            <p className={`font-mono text-lg font-medium text-white ${valueClassName}`.trim()}>
                {value}
                {unit && <span className="text-base text-gray-400 ml-1">{unit}</span>}
            </p>
            {subValue && <p className="text-xs text-gray-500 -mt-1">{subValue}</p>}
        </div>
    </div>
);

const StrategyCandidateRow: React.FC<{ candidate: StrategyCandidate, isBest: boolean }> = ({ candidate, isBest }) => (
    <div className={`grid grid-cols-4 gap-4 items-center text-sm py-3 px-4 rounded-lg border ${isBest ? 'border-cyan-400/60 bg-cyan-500/15 shadow-lg shadow-cyan-500/10' : 'border-white/5 bg-white/5'}`}>
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

const PaceHistoryChart: React.FC<{ samples: PaceSample[] }> = ({ samples }) => {
    const trimmed = samples.length > 40 ? samples.slice(-40) : samples;
    if (trimmed.length < 2) {
        return (
            <div className="h-28 flex items-center justify-center text-xs text-gray-500 border border-dashed border-white/10 rounded">
                Awaiting pace history...
            </div>
        );
    }

    const actualSeries = trimmed.map(sample => sample.actualLapSeconds);
    const predictedSeries = trimmed.map(sample => sample.predictedLapSeconds);
    const minValue = Math.min(...actualSeries, ...predictedSeries);
    const maxValue = Math.max(...actualSeries, ...predictedSeries);
    const verticalPadding = 4;
    const yRange = Math.max(maxValue - minValue, 0.5);

    const viewBoxWidth = 120;
    const viewBoxHeight = 60;

    const buildPath = (series: number[]) => {
        return series
            .map((value, index) => {
                const x = (index / (series.length - 1)) * viewBoxWidth;
                const normalized = (value - minValue) / yRange;
                const y = viewBoxHeight - verticalPadding - normalized * (viewBoxHeight - verticalPadding * 2);
                return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
            })
            .join(' ');
    };

    const actualPath = buildPath(actualSeries);
    const predictedPath = buildPath(predictedSeries);

    return (
        <div className="h-32">
            <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none">
                <defs>
                    <pattern id="gridFill" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill="url(#gridFill)" />
                <path
                    d={predictedPath}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.7)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
                <path
                    d={actualPath}
                    fill="none"
                    stroke="rgb(34, 211, 238)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div className="mt-2 flex items-center justify-between text-[0.65rem] uppercase tracking-wider text-gray-400">
                <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    Live Pace (s)
                </span>
                <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    Predicted Pace (s)
                </span>
            </div>
        </div>
    );
};

const parseLapTimeToSeconds = (lapTime: string): number | null => {
    const [minutePart, secondPart] = lapTime.split(':');
    if (!minutePart || !secondPart) return null;
    const minutes = Number.parseInt(minutePart, 10);
    const seconds = Number.parseFloat(secondPart.replace(/[^\d.]/g, ''));
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
        return null;
    }
    return minutes * 60 + seconds;
};

const formatSecondsToLapTime = (totalSeconds: number): string => {
    const safeSeconds = Number.isFinite(totalSeconds) ? totalSeconds : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds - minutes * 60;
    return `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
};

const formatDelta = (deltaSeconds: number | null): string => {
    if (deltaSeconds === null || !Number.isFinite(deltaSeconds)) {
        return 'N/A';
    }
    const sign = deltaSeconds >= 0 ? '+' : '';
    return `${sign}${deltaSeconds.toFixed(2)}s`;
};

const sanitizeGapValue = (gap: string): number | null => {
    const numeric = Number.parseFloat(gap.replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
};

const AIPredictions: React.FC<AIPredictionsProps> = ({ predictions, telemetry, paceHistory, gapPerSectorChange }) => {
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

    const driverName = telemetry.driverInputs.driver;
    const rawActualLapSeconds = parseLapTimeToSeconds(telemetry.lapTiming.currentLapTime);
    const actualLapSeconds = rawActualLapSeconds !== null 
        ? Math.max(rawActualLapSeconds, predictedLapTime + 0.35)
        : predictedLapTime + 0.4;
    const paceDeltaSeconds = actualLapSeconds - predictedLapTime;
    const paceDeltaDisplay = formatDelta(paceDeltaSeconds);
    const gapToAheadSeconds = sanitizeGapValue(telemetry.lapTiming.gapToAhead);
    const gapPerSectorValue = gapPerSectorChange !== null
        ? `${gapPerSectorChange >= 0 ? '+' : ''}${gapPerSectorChange.toFixed(3)}`
        : 'N/A';
    const gapPerSectorSubValue = gapPerSectorChange !== null
        ? (gapPerSectorChange < 0 ? 'Closing per sector' : 'Losing per sector')
        : undefined;

    const opponentAheadLap = (gapToAheadSeconds !== null)
        ? Math.max(predictedLapTime - gapToAheadSeconds, predictedLapTime - 3)
        : predictedLapTime - 0.6;
    const assumedBehindGap = gapToAheadSeconds !== null ? gapToAheadSeconds + 0.8 : 1.6;
    const opponentBehindLap = predictedLapTime + assumedBehindGap;

    const competitorCards = [
        {
            label: 'Ahead (+1 position)',
            predictedLap: opponentAheadLap,
            deltaToDriver: opponentAheadLap - predictedLapTime,
            showDelta: true,
        },
        {
            label: `${driverName}`,
            predictedLap: actualLapSeconds,
            deltaToDriver: 0,
            showDelta: false,
        },
        {
            label: 'Behind (-1 position)',
            predictedLap: opponentBehindLap,
            deltaToDriver: opponentBehindLap - predictedLapTime,
            showDelta: true,
        },
    ];

    const summaryMessage = (() => {
        if (gapPerSectorChange !== null) {
            const magnitude = Math.abs(gapPerSectorChange);
            if (magnitude >= 0.02) {
                if (gapPerSectorChange < 0) {
                    return `${driverName} is closing the gap by ${magnitude.toFixed(3)}s per sector.`;
                }
                return `${driverName} is slipping ${magnitude.toFixed(3)}s per sector versus the car ahead.`;
            }
        }
        const magnitude = Math.abs(paceDeltaSeconds);
        if (magnitude <= 0.2) {
            return `${driverName} is tracking the model within ${magnitude.toFixed(2)}s per lap.`;
        }
        return `${driverName} trails model expectations by ${paceDeltaSeconds.toFixed(2)}s per lap.`;
    })();

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-4 xl:gap-6">
            <div className="space-y-4">
                <DashboardPanel title={`Optimal Strategy - Lap ${lap}`} className="xl:py-2">
                    <div className="space-y-5">
                        <div className="rounded-lg border border-cyan-400/60 bg-cyan-500/15 px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-lg shadow-cyan-500/10">
                            <div>
                                <p className="text-[0.65rem] uppercase tracking-wider text-cyan-100/70">Priority Strategy</p>
                                <p className="text-3xl font-semibold text-cyan-100">{bestAction.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[0.65rem] uppercase tracking-wider text-gray-300">Expected Gain</p>
                                    <p className="font-mono text-3xl font-bold text-green-300">{expectedTimeGain.toFixed(2)}s</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[0.65rem] uppercase tracking-wider text-gray-300">Confidence</p>
                                    <p className="font-mono text-3xl font-bold">{Math.round(confidence * 100)}%</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Rationale</p>
                            <div className="flex flex-wrap gap-2">
                                {rationaleTags.map(tag => (
                                    <span key={tag} className="text-xs bg-gray-700 text-gray-200 px-2.5 py-1 rounded-full">
                                        {tag.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-3">
                            <div className="grid grid-cols-4 gap-4 text-[0.65rem] text-gray-400 uppercase tracking-wider px-3 pb-2">
                                <span>Action</span>
                                <span className="text-right">Gain / Loss (µ)</span>
                                <span className="text-right">Risk (σ)</span>
                                <span className="text-right">Confidence</span>
                            </div>
                            <div className="space-y-2">
                                {strategyCandidates.map((c, i) => (
                                    <StrategyCandidateRow key={i} candidate={c} isBest={c.action === bestAction} />
                                ))}
                            </div>
                        </div>
                    </div>
                </DashboardPanel>

                <DashboardPanel title="Predictive Analytics">
                    <div className="space-y-3">
                        <div className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-3">
                            <p className="text-[0.65rem] uppercase tracking-wider text-cyan-100/70">Predicted Lap Time</p>
                            <p className="font-mono text-3xl font-semibold text-white">{predictedLapTime.toFixed(2)}s</p>
                            <p className="text-xs text-cyan-100/70 mt-1">Model target for next lap</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                <p className="text-[0.65rem] uppercase tracking-wider text-gray-400">Pace Variance</p>
                                <p className="font-mono text-lg text-white">±{paceVariance.toFixed(2)}s</p>
                                <p className="text-[0.65rem] text-gray-500">Performance spread</p>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                <p className="text-[0.65rem] uppercase tracking-wider text-gray-400">Tire Degradation</p>
                                <p className="font-mono text-lg text-white">{degradationSlope.toFixed(2)} s/lap</p>
                                <p className="text-[0.65rem] text-gray-500">Projected loss per lap</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                <p className="text-[0.65rem] uppercase tracking-wider text-gray-400">Rain Probability</p>
                                <p className="font-mono text-lg text-white">{(eventProbabilities.rainNext3 * 100).toFixed(0)}%</p>
                                <p className="text-[0.65rem] text-gray-500">
                                    {eventProbabilities.rainLapEstimate ? `est. Lap ${eventProbabilities.rainLapEstimate}` : 'next 3 laps'}
                                </p>
                            </div>
                            <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                <p className="text-[0.65rem] uppercase tracking-wider text-gray-400">Safety Car Prob.</p>
                                <p className="font-mono text-lg text-white">{(eventProbabilities.safetyCarNext3 * 100).toFixed(0)}%</p>
                                <p className="text-[0.65rem] text-gray-500">
                                    {eventProbabilities.safetyCarLapEstimate ? `est. Lap ${eventProbabilities.safetyCarLapEstimate}` : 'next 3 laps'}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between text-[0.6rem] uppercase tracking-widest text-gray-400 border-t border-white/10 pt-2">
                            <span>Model {modelMeta.version}</span>
                            <span>{modelMeta.updateTimeMs} ms</span>
                        </div>
                    </div>
                </DashboardPanel>
            </div>

            <div className="space-y-4">
                <DashboardPanel title="Race Pace Pulse" className="xl:max-w-[520px] xl:ml-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <AnalyticsDataPoint label="Actual Lap Time" value={formatSecondsToLapTime(actualLapSeconds)} />
                        <AnalyticsDataPoint label="Model Target" value={formatSecondsToLapTime(predictedLapTime)} />
                        <div className="sm:col-span-2">
                            <AnalyticsDataPoint 
                                label="Delta vs Target" 
                                value={paceDeltaDisplay}
                                subValue={paceDeltaSeconds < 0 ? 'Faster than forecast' : 'Slower than forecast'}
                            />
                        </div>
                        {gapToAheadSeconds !== null && (
                            <AnalyticsDataPoint label="Gap to Car Ahead" value={`+${gapToAheadSeconds.toFixed(2)}s`} />
                        )}
                        <AnalyticsDataPoint 
                            label="Gap Change / Sector" 
                            value={gapPerSectorValue}
                            unit={gapPerSectorChange !== null ? 's' : undefined}
                            subValue={gapPerSectorSubValue}
                        />
                    </div>
                    <div className="mt-3 rounded-md bg-white/5 px-4 py-3 text-sm text-gray-200">
                        {summaryMessage}
                    </div>
                    <div className="mt-3">
                        <PaceHistoryChart samples={paceHistory} />
                    </div>
                </DashboardPanel>

                <DashboardPanel title="Opponent Outlook" className="xl:max-w-[520px] xl:ml-auto">
                    <div className="space-y-2">
                        {competitorCards.map(card => (
                            <div key={card.label} className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs uppercase tracking-wider text-gray-400">{card.label}</span>
                                    <span className="font-mono text-lg font-semibold text-white">
                                        {formatSecondsToLapTime(card.predictedLap)}
                                    </span>
                                </div>
                                {card.showDelta && (
                                    <div className="mt-1 flex justify-between text-[0.65rem] text-gray-400">
                                        <span>Delta to driver</span>
                                        <span className={`font-mono ${card.deltaToDriver <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatDelta(card.deltaToDriver)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DashboardPanel>
            </div>
        </div>
    );
};

export default AIPredictions;
