export enum AlertLevel {
    Info = 'INFO',
    Warning = 'WARNING',
    Error = 'ERROR',
}

export interface SystemAlert {
    id: string;
    level: AlertLevel;
    message: string;
    timestamp: string;
}

export type DriverId = 'VER' | 'HAM' | 'LEC' | 'NOR';

export interface LapTiming {
    driverId: DriverId;
    currentLapTime: string;
    s1: string;
    s2: string;
    bestLap: string;
    gapToAhead: string;
}

export interface DriverInputs {
    driver: string;
    throttle: number;
    clutch: number;
}

export interface Engine {
    rpm: number;
    torque: number;
    fuelFlow: number;
    oilPressure: number;
}

export interface PositionStrategy {
    position: number;
    pitStops: number;
    stintLength: number;

    pitDelta: number;
}

export interface FuelManagement {
    fuelPerLap: number;
    fuelDelta: number;
    liftAndCoast: number;
}

export interface Tires {
    compound: string;
    wearRate: number;
    surfaceTemp: number;
    carcassTemp: number;
}

export interface Brakes {
    discTemp: number;
    padTemp: number;
    brakePressure: number;
    brakeBias: string;
}

export interface Suspension {
    rideHeight: number;
    damperTravel: number;
    lateralLoad: number;
    longitudinalLoad: number;
}

export interface Aerodynamics {
    rideHeight: number;
    damperTravel: number;
    lateralLoad: number;
    longitudinalLoad: number;
}

export interface TelemetryData {
    lapTiming: LapTiming;
    driverInputs: DriverInputs;
    engine: Engine;
    positionStrategy1: PositionStrategy;
    fuelManagement: FuelManagement;
    tires: Tires;
    brakes: Brakes;
    suspension: Suspension;
    aerodynamics: Aerodynamics;
    systemAlerts: SystemAlert[];
}

// AI Prediction Types
export interface StrategyCandidate {
    action: string;
    mu: number;
    sigma: number;
    conf: number;
}

export interface AdvancedAIPredictionsData {
    lap: number;
    bestAction: string;
    expectedTimeGain: number;
    confidence: number;
    rationaleTags: string[];
    predictedLapTime: number;
    paceVariance: number;
    degradationSlope: number;
    eventProbabilities: {
        rainNext3: number;
        safetyCarNext3: number;
    };
    modelMeta: {
        version: string;
        updateTimeMs: number;
    };
    strategyCandidates: StrategyCandidate[];
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}
