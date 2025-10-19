// This file defines the TypeScript types for the application data.

export interface LapTiming {
  currentLapTime: string;
  s1: string;
  s2: string;
  bestLap: string;
  gapToAhead: string;
  driverId: string;
}

export interface DriverInputs {
  throttle: number; // percentage
  clutch: number; // percentage
  driver: string;
}

export interface Engine {
  rpm: number;
  torque: number; // 0-100 scale for bar
  fuelFlow: number; // 0-100 scale for bar
  oilPressure: number;
}

export interface PositionStrategy {
  position: string;
  pitStops: number;
  stintLength: number;
  pitDelta: string;
}

export interface FuelManagement {
  fuelPerLap: number;
  fuelDelta: number;
  liftAndCoast: number; // percentage
}

export interface Tires {
  compound: 'Hard' | 'Medium' | 'Soft' | 'Intermediate' | 'Wet';
  wearRate: number;
  surfaceTemp: number;
  carcassTemp: number;
}

export interface Brakes {
  discTemp: number;
  padTemp: number;
  brakePressure: number; // percentage
  brakeBias: string;
}

export interface SystemHealth {
  sensor: 'OK' | 'WARN' | 'FAIL';
  signalLoss: number; // percentage
}

export interface Chassis {
  rideHeight: number;
  damperTravel: number;
  lateralLoad: number;
  longitudinalLoad: number;
}

export interface Aero {
  rideHeight: string;
  damperTravel: number; // percentage
  lateralLoad: number;
  longitudinalLoad: number;
}

export enum AlertType {
  Overheating = 'Overheating',
  BatteryFault = 'Battery Fault',
  ERS_Error = 'ERS Error',
  Communications = 'Communications',
}

export enum AlertLevel {
  Warning = 'warning',
  Info = 'info',
  Error = 'error',
}

export interface SystemAlert {
  id: number;
  type: AlertType;
  level: AlertLevel;
}

export interface TelemetryData {
  trackName: string;
  trackTemp: number;
  lapTiming: LapTiming;
  driverInputs: DriverInputs;
  engine: Engine;
  positionStrategy1: PositionStrategy;
  positionStrategy2: PositionStrategy;
  fuelManagement: FuelManagement;
  tires: Tires;
  brakes: Brakes;
  systemHealth: SystemHealth;
  suspension: Chassis;
  aerodynamics: Aero;
  systemAlerts: SystemAlert[];
}

// New, advanced types for AI predictions based on the sample data
export interface EventProbabilities {
  rainNext3: number;
  safetyCarNext3: number;
}

export interface StrategyCandidate {
  action: string;
  mu: number;
  sigma: number;
  conf: number;
}

export type RationaleTag = "degradation_up" | "clean_air" | string;

export interface AdvancedAIPredictionsData {
  lap: number;
  predictedLapTime: number;
  paceVariance: number;
  degradationSlope: number;
  eventProbabilities: EventProbabilities;
  strategyCandidates: StrategyCandidate[];
  bestAction: string;
  expectedTimeGain: number;
  confidence: number;
  rationaleTags: RationaleTag[];
  modelMeta: {
    version: string;
    updateTimeMs: number;
  };
}