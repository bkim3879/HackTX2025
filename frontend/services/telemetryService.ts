import { TelemetryData, AdvancedAIPredictionsData, SystemAlert, AlertLevel, DriverId } from '../types';

const DRIVERS: { [key in DriverId]: string } = {
  VER: 'Max Verstappen',
  HAM: 'Lewis Hamilton',
  LEC: 'Charles Leclerc',
  NOR: 'Lando Norris',
};

// Helper to format time
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
};

// Helper for random variations
const fluctuate = (base: number, variance: number) => base + (Math.random() - 0.5) * variance;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const getNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

type StrategyTemplateType = 'pit' | 'attack' | 'defend' | 'conserve' | 'maintain';

type StrategyTemplate = {
  action: string;
  type: StrategyTemplateType;
  baseMu: number;
  muVariance: number;
  baseSigma: number;
  sigmaVariance: number;
  baseConf: number;
  confVariance: number;
  rationaleTags: string[];
};

const STRATEGY_LIBRARY: StrategyTemplate[] = [
  {
    action: 'OVERTAKE WINDOW',
    type: 'attack',
    baseMu: -2.4,
    muVariance: 0.6,
    baseSigma: 1.4,
    sigmaVariance: 0.25,
    baseConf: 0.74,
    confVariance: 0.05,
    rationaleTags: ['BATTERY READY', 'FRONT GRIP STRONG'],
  },
  {
    action: 'SAVE TIRES',
    type: 'conserve',
    baseMu: -1.2,
    muVariance: 0.12,
    baseSigma: 0.9,
    sigmaVariance: 0.08,
    baseConf: 0.72,
    confVariance: 0.03,
    rationaleTags: ['DEGRADATION UP', 'RACE LONG'],
  },
  {
    action: 'DEFEND POSITION',
    type: 'defend',
    baseMu: -1.4,
    muVariance: 0.5,
    baseSigma: 1.6,
    sigmaVariance: 0.25,
    baseConf: 0.68,
    confVariance: 0.05,
    rationaleTags: ['TRAFFIC BEHIND', 'BATTERY LIMITED'],
  },
  {
    action: 'MANAGE FUEL',
    type: 'conserve',
    baseMu: -1.1,
    muVariance: 0.5,
    baseSigma: 1.3,
    sigmaVariance: 0.2,
    baseConf: 0.66,
    confVariance: 0.04,
    rationaleTags: ['FUEL DELTA NEG', 'LIFT AND COAST'],
  },
  {
    action: 'PIT IN 2 SOFT',
    type: 'pit',
    baseMu: -5.4,
    muVariance: 0.6,
    baseSigma: 1.9,
    sigmaVariance: 0.25,
    baseConf: 0.8,
    confVariance: 0.05,
    rationaleTags: ['WINDOW OPEN', 'SOFTS READY'],
  },
  {
    action: 'PIT LATE HARD',
    type: 'pit',
    baseMu: -4.8,
    muVariance: 0.5,
    baseSigma: 2.1,
    sigmaVariance: 0.3,
    baseConf: 0.77,
    confVariance: 0.05,
    rationaleTags: ['EXTEND FOR SAFETY CAR', 'CLEAR AIR'],
  },
  {
    action: 'DEPLOY BATTERY',
    type: 'attack',
    baseMu: -2.0,
    muVariance: 0.5,
    baseSigma: 1.3,
    sigmaVariance: 0.2,
    baseConf: 0.72,
    confVariance: 0.05,
    rationaleTags: ['ERS AVAILABLE', 'CLEAN AIR'],
  },
  {
    action: 'HOLD POSITION',
    type: 'maintain',
    baseMu: -0.6,
    muVariance: 0.3,
    baseSigma: 1.0,
    sigmaVariance: 0.2,
    baseConf: 0.69,
    confVariance: 0.05,
    rationaleTags: ['PACE STABLE', 'TRAFFIC AHEAD'],
  },
];

let lapCounter = 20;
let projectedLapBaseline = 95.4;
const driverPaceOffset: Record<DriverId, number> = {
  VER: 0.85,
  HAM: 0.92,
  LEC: 0.78,
  NOR: 0.88,
};

let rainProbability = 0.04;
let safetyCarProbability = 0.08;
let nextProbabilityUpdateAt = 0;

let currentPriorityStrategy: StrategyTemplate = STRATEGY_LIBRARY[0];
let nextStrategyRotationAt = 0;
let lastLapUpdateTimestamp = 0;
const LAP_INTERVAL_MS = 90_000;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const rotatePriorityStrategy = () => {
  const preferNonPit = Math.random() > 0.25;
  const pool = preferNonPit
    ? STRATEGY_LIBRARY.filter((template) => template.type !== 'pit')
    : STRATEGY_LIBRARY;
  currentPriorityStrategy = pool[Math.floor(Math.random() * pool.length)] ?? STRATEGY_LIBRARY[0];
  nextStrategyRotationAt = getNow() + randomBetween(10000, 20000);
};

const ensurePriorityStrategy = () => {
  if (nextStrategyRotationAt === 0 || getNow() >= nextStrategyRotationAt) {
    rotatePriorityStrategy();
  }
};

const materializeCandidate = (template: StrategyTemplate) => ({
  action: template.action,
  mu: fluctuate(template.baseMu, template.muVariance),
  sigma: Math.abs(fluctuate(template.baseSigma, template.sigmaVariance)),
  conf: clamp(fluctuate(template.baseConf, template.confVariance), 0.35, 0.97),
  template,
});

const updateProbabilityCurves = () => {
  const currentTime = getNow();
  if (currentTime < nextProbabilityUpdateAt) {
    return;
  }

  rainProbability = clamp(
    rainProbability + (Math.random() - 0.45) * 0.004,
    0.01,
    0.12,
  );
  safetyCarProbability = clamp(
    safetyCarProbability + (Math.random() - 0.5) * 0.006,
    0.05,
    0.18,
  );

  nextProbabilityUpdateAt = currentTime + randomBetween(2800, 4200);
};

const updatePaceModel = (driverId: DriverId) => {
  projectionDrift();
  const offsetDrift = (Math.random() - 0.5) * 0.04;
  driverPaceOffset[driverId] = clamp(driverPaceOffset[driverId] + offsetDrift, 0.55, 1.25);
};

const projectionDrift = () => {
  projectedLapBaseline = clamp(
    projectedLapBaseline - 0.008 + (Math.random() - 0.5) * 0.02,
    93.2,
    96.4,
  );
};

const maybeAdvanceLap = () => {
  const currentTime = getNow();
  if (lastLapUpdateTimestamp === 0) {
    lastLapUpdateTimestamp = currentTime;
    return;
  }

  const elapsed = currentTime - lastLapUpdateTimestamp;
  if (elapsed < LAP_INTERVAL_MS) {
    return;
  }

  const increments = Math.floor(elapsed / LAP_INTERVAL_MS);
  lapCounter = (lapCounter + increments) % 61;
  lastLapUpdateTimestamp += increments * LAP_INTERVAL_MS;
};

// Generates a single frame of telemetry data
export const generateTelemetryData = (driverId: DriverId): TelemetryData => {
  updatePaceModel(driverId);

  const throttle = fluctuate(80, 40);
  
  // Simulate some alerts
  const systemAlerts: SystemAlert[] = [];
  if (Math.random() < 0.01) {
    systemAlerts.push({
      id: `err-${Date.now()}`,
      level: AlertLevel.Error,
      message: 'ERS fault detected. Power loss imminent.',
      timestamp: new Date().toLocaleTimeString(),
    });
  }
  if (Math.random() < 0.05) {
     systemAlerts.push({
      id: `warn-${Date.now()}`,
      level: AlertLevel.Warning,
      message: `Tire temps approaching critical threshold. LF: ${fluctuate(115, 5).toFixed(0)}c`,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  const actualLapSeconds = clamp(
    projectedLapBaseline + driverPaceOffset[driverId] + (Math.random() - 0.5) * 0.18,
    92,
    99,
  );
  const sector1Seconds = clamp(actualLapSeconds * 0.33 + (Math.random() - 0.5) * 0.15, 28, 34);
  const sector2Seconds = clamp(actualLapSeconds * 0.35 + (Math.random() - 0.5) * 0.15, 29, 35);

  return {
    lapTiming: {
      driverId: driverId,
      currentLapTime: formatTime(actualLapSeconds),
      s1: formatTime(sector1Seconds),
      s2: formatTime(sector2Seconds),
      bestLap: formatTime(91.883),
      gapToAhead: `+${fluctuate(1.2, 0.3).toFixed(3)}`,
    },
    driverInputs: {
      driver: DRIVERS[driverId],
      throttle: Math.max(0, Math.min(100, throttle)),
      clutch: fluctuate(5, 5),
    },
    engine: {
      rpm: Math.round(fluctuate(11500, 1000)),
      torque: fluctuate(95, 10),
      fuelFlow: fluctuate(90, 5),
      oilPressure: fluctuate(5.5, 0.2),
    },
    positionStrategy1: {
      position: 4,
      pitStops: 1,
      stintLength: 18,
      pitDelta: fluctuate(22.5, 0.5),
    },
    fuelManagement: {
      fuelPerLap: fluctuate(1.65, 0.1),
      fuelDelta: fluctuate(-0.2, 0.15),
      liftAndCoast: fluctuate(5, 3),
    },
    tires: {
      compound: 'Medium',
      wearRate: fluctuate(0.15, 0.05),
      surfaceTemp: fluctuate(105, 5),
      carcassTemp: fluctuate(115, 5),
    },
    brakes: {
      discTemp: Math.round(fluctuate(800, 150)),
      padTemp: Math.round(fluctuate(500, 100)),
      brakePressure: Math.round(fluctuate(60, 40)),
      brakeBias: '54.5%',
    },
    suspension: {
      rideHeight: fluctuate(35, 2),
      damperTravel: fluctuate(20, 5),
      lateralLoad: fluctuate(3.5, 1),
      longitudinalLoad: fluctuate(4.8, 1.2),
    },
    aerodynamics: {
      rideHeight: 35.1,
      damperTravel: fluctuate(50, 10),
      lateralLoad: fluctuate(3.2, 0.8),
      longitudinalLoad: fluctuate(4.5, 1.0),
    },
    systemAlerts: systemAlerts,
  };
};

// Generates a single AI prediction
export const generateAIPredictionData = (): AdvancedAIPredictionsData => {
  ensurePriorityStrategy();
  updateProbabilityCurves();
  maybeAdvanceLap();

  const candidatePool = STRATEGY_LIBRARY.filter(
    (template) => template.action !== currentPriorityStrategy.action,
  );

  const bestCandidate = materializeCandidate(currentPriorityStrategy);

  const additionalCandidates: ReturnType<typeof materializeCandidate>[] = [];
  const desiredTotal = 4;

  const availablePit = candidatePool.filter((template) => template.type === 'pit');
  const availableNonPit = candidatePool.filter((template) => template.type !== 'pit');

  if (Math.random() < 0.3 && availablePit.length > 0) {
    const pitTemplate = availablePit[Math.floor(Math.random() * availablePit.length)];
    additionalCandidates.push(materializeCandidate(pitTemplate));
  }

  while (additionalCandidates.length < desiredTotal - 1 && availableNonPit.length > 0) {
    const index = Math.floor(Math.random() * availableNonPit.length);
    const template = availableNonPit.splice(index, 1)[0];
    additionalCandidates.push(materializeCandidate(template));
  }

  const smallestOtherMu = additionalCandidates.reduce(
    (min, candidate) => Math.min(min, candidate.mu),
    Number.POSITIVE_INFINITY,
  );

  if (Number.isFinite(smallestOtherMu)) {
    bestCandidate.mu = Math.min(bestCandidate.mu, smallestOtherMu - 0.3);
  }

  const strategyCandidates = [bestCandidate, ...additionalCandidates]
    .map(({ template, ...candidate }) => candidate)
    .sort((a, b) => a.mu - b.mu);

  const best = strategyCandidates[0];
  const predictedLapTime = clamp(
    projectedLapBaseline + (Math.random() - 0.5) * 0.12,
    92.8,
    97,
  );
  const rationaleTags = currentPriorityStrategy.rationaleTags;

  return {
    lap: lapCounter,
    bestAction: best.action,
    expectedTimeGain: Math.max(0, -best.mu),
    confidence: best.conf,
    rationaleTags,
    predictedLapTime,
    paceVariance: clamp(fluctuate(0.18, 0.04), 0.1, 0.28),
    degradationSlope: clamp(fluctuate(0.027, 0.008), 0.015, 0.04),
    eventProbabilities: {
      rainNext3: rainProbability,
      safetyCarNext3: safetyCarProbability,
      rainLapEstimate: rainProbability > 0.09 ? (lapCounter + Math.floor(randomBetween(4, 8))) % 61 : null,
      safetyCarLapEstimate: safetyCarProbability > 0.11 ? (lapCounter + Math.floor(randomBetween(3, 7))) % 61 : null,
    },
    modelMeta: {
      version: 'vrtsc_1.0.3',
      updateTimeMs: Math.round(clamp(fluctuate(48, 6), 38, 62)),
    },
    strategyCandidates,
  };
};

rotatePriorityStrategy();
