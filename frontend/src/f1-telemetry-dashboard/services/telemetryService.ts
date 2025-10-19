import { TelemetryData, Tires, AlertType, AlertLevel, SystemAlert } from '../types';

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, '0');
    return `${mins}:${secs}`;
};

let lapTimeSeconds = 91.845;

export const getInitialData = (): TelemetryData => ({
    trackName: 'Silverstone Circuit',
    trackTemp: 42,
    lapTiming: {
        currentLapTime: '1:31.845',
        s1: '28.527',
        s2: '30.101',
        bestLap: '+1.187',
        gapToAhead: '+2.345',
        driverId: 'GA1 ARD AH4A',
    },
    driverInputs: {
        throttle: 92,
        clutch: 12,
        driver: 'T-EREIE',
    },
    engine: {
        rpm: 10720,
        torque: 70,
        fuelFlow: 80,
        oilPressure: 5.6,
    },
    positionStrategy1: {
        position: 'P3',
        pitStops: 1,
        stintLength: 22,
        pitDelta: '20.1',
    },
    positionStrategy2: {
        position: 'P3',
        pitStops: 1,
        stintLength: 1,
        pitDelta: '--',
    },
    fuelManagement: {
        fuelPerLap: 2.34,
        fuelDelta: -0.08,
        liftAndCoast: 15,
    },
    tires: {
        compound: 'Hard',
        wearRate: 0.38,
        surfaceTemp: 76,
        carcassTemp: 17,
    },
    brakes: {
        discTemp: 789,
        padTemp: 608,
        brakePressure: 985,
        brakeBias: '56.5% 43.5%',
    },
    systemHealth: {
        sensor: 'OK',
        signalLoss: 0.2,
    },
    suspension: {
        rideHeight: 22,
        damperTravel: 42,
        lateralLoad: 1.8,
        longitudinalLoad: 2.3,
    },
    aerodynamics: {
        rideHeight: 'Active',
        damperTravel: 23,
        lateralLoad: 1.1,
        longitudinalLoad: 2.3,
    },
    systemAlerts: [
        { id: 1, type: AlertType.Overheating, level: AlertLevel.Warning },
        { id: 2, type: AlertType.BatteryFault, level: AlertLevel.Warning },
        { id: 3, type: AlertType.ERS_Error, level: AlertLevel.Error },
        { id: 4, type: AlertType.Communications, level: AlertLevel.Info },
    ],
});

export const updateTelemetryData = (currentData: TelemetryData): TelemetryData => {
    const newData = { ...currentData };

    lapTimeSeconds += 0.05;
    newData.lapTiming.currentLapTime = formatTime(lapTimeSeconds);

    newData.driverInputs.throttle = Math.max(0, Math.min(100, currentData.driverInputs.throttle + randomBetween(-5, 5)));
    newData.driverInputs.clutch = Math.max(0, Math.min(100, currentData.driverInputs.clutch + randomBetween(-2, 2)));
    
    newData.engine.rpm = Math.floor(Math.max(8000, Math.min(12500, currentData.engine.rpm + randomBetween(-150, 150))));
    newData.engine.torque = Math.max(0, Math.min(100, currentData.engine.torque + randomBetween(-3, 3)));
    newData.engine.fuelFlow = Math.max(0, Math.min(100, currentData.engine.fuelFlow + randomBetween(-2, 2)));

    newData.brakes.discTemp = Math.floor(Math.max(400, Math.min(1000, currentData.brakes.discTemp + randomBetween(-20, 20))));
    newData.brakes.padTemp = Math.floor(Math.max(300, Math.min(800, currentData.brakes.padTemp + randomBetween(-15, 15))));

    newData.tires.surfaceTemp = Math.floor(Math.max(60, Math.min(110, currentData.tires.surfaceTemp + randomBetween(-1, 1))));

    return newData;
};