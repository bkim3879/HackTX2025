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

let lapCounter = 1;
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

  const candidates: AdvancedAIPredictionsData['strategyCandidates'] = [
    { action: 'PIT_NOW', mu: -1.25, sigma: 0.8, conf: 0.82 },
    { action: 'EXTEND_STINT', mu: 0.5, sigma: 1.2, conf: 0.65 },
    { action: 'MAINTAIN_PACE', mu: 0.1, sigma: 0.5, conf: 0.95 },
  ].sort((a,b) => b.mu - a.mu);

  const best = candidates.find(c => c.action === 'MAINTAIN_PACE')!;
  
  return {
    lap: lapCounter,
    bestAction: best.action,
    expectedTimeGain: -best.mu, // Invert mu for gain
    confidence: best.conf,
    rationaleTags: ['OPTIMAL_TIRE_WINDOW', 'LOW_TRAFFIC_AHEAD', 'FUEL_TARGET_GREEN'],
    predictedLapTime: fluctuate(lastLapTime, 0.2),
    paceVariance: fluctuate(0.25, 0.1),
    degradationSlope: fluctuate(0.08, 0.02),
    eventProbabilities: {
      rainNext3: fluctuate(0.05, 0.03),
      safetyCarNext3: fluctuate(0.15, 0.05),
    },
    modelMeta: {
      version: '3.1.4-beta',
      updateTimeMs: Math.round(performance.now() - startTime + 25),
    },
    strategyCandidates: candidates,
  };
};
