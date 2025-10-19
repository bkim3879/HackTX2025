export type DriverId = 'VER' | 'HAM' | 'LEC' | 'NOR' | string;

export type Compound = 'S' | 'M' | 'H' | 'I' | 'W';

export interface TelemetryTickDTO {
    raceId: string;
    driverId: string;
    ts: string;
    lap: number;
    stintAge: number;
    compound: Compound;
    pace: number | null;
    tireWear: number | null;
    fuel: number | null;
    trackTemp: number | null;
    rainProb: number | null;
    scProb: number | null;
    gapFront: number | null;
    gapBack: number | null;
    position: number | null;
}

export interface RecommendationAction {
    action: string;
    mu: number;
    sigma: number;
    conf?: number | null;
    reasons?: string[] | null;
}

export interface RecommendationModel {
    version: string;
    latencyMs: number;
}

export interface RecommendationDTO {
    best: RecommendationAction;
    alts: RecommendationAction[];
    model: RecommendationModel;
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export interface PaceSample {
    actualLapSeconds: number;
    predictedLapSeconds: number;
    timestamp: number;
}
