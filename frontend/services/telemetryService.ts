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

let lapCounter = 20;
let lastLapTime = 92.5;

// Generates a single frame of telemetry data
export const generateTelemetryData = (driverId: DriverId): TelemetryData => {
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

  return {
    lapTiming: {
      driverId: driverId,
      currentLapTime: formatTime(fluctuate(lastLapTime, 1.5)),
      s1: formatTime(fluctuate(30, 0.5)),
      s2: formatTime(fluctuate(32, 0.5)),
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
      position: 1,
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
  const startTime = performance.now();
  lapCounter++;
  lastLapTime -= fluctuate(0.1, 0.05); // Car is getting lighter

  const rainProb = fluctuate(0.15, 0.1);
  const scProb = fluctuate(0.06, 0.04);

  const candidates: AdvancedAIPredictionsData['strategyCandidates'] = [
    { action: 'pit in 2 soft', mu: fluctuate(-6.20, 0.5), sigma: fluctuate(1.90, 0.2), conf: fluctuate(0.82, 0.05) },
    { action: 'pit now soft', mu: fluctuate(-5.80, 0.5), sigma: fluctuate(1.60, 0.2), conf: fluctuate(0.77, 0.05) },
    { action: 'stay 3 laps', mu: fluctuate(2.80, 0.5), sigma: fluctuate(2.20, 0.2), conf: fluctuate(0.41, 0.1) },
  ].sort((a,b) => a.mu - b.mu);

  const best = candidates[0];
  
  return {
    lap: lapCounter,
    bestAction: best.action,
    expectedTimeGain: -best.mu,
    confidence: best.conf,
    rationaleTags: ['DEGRADATION UP', 'CLEAN AIR'],
    predictedLapTime: fluctuate(95.80, 0.3),
    paceVariance: fluctuate(0.21, 0.05),
    degradationSlope: fluctuate(0.03, 0.01),
    eventProbabilities: {
      rainNext3: rainProb,
      safetyCarNext3: scProb,
      rainLapEstimate: rainProb > 0.12 ? lapCounter + Math.floor(fluctuate(5, 2)) : null,
      safetyCarLapEstimate: scProb > 0.1 ? lapCounter + Math.floor(fluctuate(4, 2)) : null,
    },
    modelMeta: {
      version: 'vrtsc_1.0.3',
      updateTimeMs: Math.round(fluctuate(48, 10)),
    },
    strategyCandidates: candidates,
  };
};