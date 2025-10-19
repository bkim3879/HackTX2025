import { TelemetryData, Tires, AlertType, AlertLevel, SystemAlert } from '../types';

// CSV iterator (if provided) will supply rows to drive telemetry updates
export type CsvRow = Record<string, string>;
export interface CsvIterator {
    rows: CsvRow[];
    index: number;
    next(): CsvRow | null;
}

export function makeCsvIterator(rows: CsvRow[]): CsvIterator {
    return {
        rows,
        index: 0,
        next() {
            if (!rows || rows.length === 0) return null;
            const r = rows[this.index % rows.length];
            this.index = (this.index + 1) % rows.length;
            return r;
        },
    };
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, '0');
    return `${mins}:${secs}`;
};

let lapTimeSeconds = 91.845;
// Track total elapsed seconds for lap counting (increments every tick)
let totalElapsedSeconds = 0;
let nextLapAt = 120; // seconds - increment lap when elapsed crosses this
let lapCount = 0; // will be initialized from first update if possible
// brakes update timing
let lastBrakesUpdate = 0;
const BRAKES_UPDATE_INTERVAL = 1.0; // seconds
// tick/update cadence
const TICK_SECONDS = 0.2; // App tick interval
const UPDATE_INTERVAL_SECONDS = 3.0; // apply numeric updates every 3 seconds
let lastUpdateAt = 0;

// Optional CSV iterator that, if set, will be used to update telemetry values deterministically
export let csvIterator: CsvIterator | null = null;

export function setCsvIterator(it: CsvIterator | null) {
    csvIterator = it;
}

// If true, numeric telemetry fields will be driven by a random generator instead of CSV values
export let useRandomNumbers = true;
export function setRandomizeNumbers(enabled: boolean) {
    useRandomNumbers = enabled;
}

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
    // initialize lapCount from current data on first run
    if (!lapCount) {
        const init = currentData?.positionStrategy1?.stintLength;
        lapCount = typeof init === 'number' ? init : lapCount;
    }
    // increment elapsed time by the tick interval
    totalElapsedSeconds += TICK_SECONDS;
    // if we've crossed the next lap threshold, increment lapCount and move the threshold
    if (totalElapsedSeconds >= nextLapAt) {
        lapCount += 1;
        nextLapAt += 120; // next lap in 120s
    }
        // Decide whether it's time to apply a new numeric update (CSV or random)
        const shouldUpdate = (totalElapsedSeconds - lastUpdateAt) >= UPDATE_INTERVAL_SECONDS;
        // If a CSV iterator is configured, only advance it when we actually apply updates; otherwise peek the current row
        const csvRow = csvIterator ? (shouldUpdate ? csvIterator.next() : (csvIterator.rows[csvIterator.index % csvIterator.rows.length] ?? null)) : null;

        // Always advance the visible lap time smoothly each tick to avoid sudden jumps
        lapTimeSeconds += TICK_SECONDS;
        newData.lapTiming.currentLapTime = formatTime(lapTimeSeconds);

        if (useRandomNumbers) {
            // Randomized numeric mode: apply numeric changes only on the slower cadence to avoid big jumps
            if (shouldUpdate) {
                newData.driverInputs.throttle = Math.max(0, Math.min(100, Math.round(randomBetween(0, 100))));
                newData.driverInputs.clutch = Math.max(0, Math.min(100, Math.round(randomBetween(0, 100))));
                newData.driverInputs.driver = csvRow?.['driver'] || newData.driverInputs.driver;

                newData.engine.rpm = Math.floor(Math.max(0, Math.min(20000, randomBetween(3000, 12000))));
                newData.engine.torque = Math.max(0, Math.min(100, Math.round(randomBetween(10, 100))));
                newData.engine.fuelFlow = Math.max(0, Math.min(2000, Math.round(randomBetween(0, 1200))));

                newData.brakes.discTemp = Math.floor(Math.max(0, Math.min(2000, randomBetween(200, 900))));
                newData.brakes.padTemp = Math.floor(Math.max(0, Math.min(2000, randomBetween(150, 800))));
                newData.brakes.brakePressure = Math.max(0, Math.min(2000, Math.round(randomBetween(0, 1000))));
                newData.brakes.brakeBias = `${Math.round(randomBetween(40, 60))}%`;

                newData.tires.surfaceTemp = Math.floor(Math.max(0, Math.min(200, randomBetween(60, 110))));

                newData.positionStrategy1 = {
                    ...newData.positionStrategy1,
                    stintLength: lapCount,
                };

                lastUpdateAt = totalElapsedSeconds;
            }

            return newData;
        }

        if (csvRow) {
            // Debug: log the first few CSV rows once so we can inspect headers/values during development
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (updateTelemetryData as any)._csvDebugCount = (updateTelemetryData as any)._csvDebugCount || 0;
            if ((updateTelemetryData as any)._csvDebugCount < 6) {
                // Use console.log so the sample rows are visible in typical browser console settings
                console.log('CSV iterator row sample', (updateTelemetryData as any)._csvDebugCount, csvRow);
                (updateTelemetryData as any)._csvDebugCount += 1;
            }
            // Apply driver inputs early so the UI reflects driver info first
            const driver = csvRow['driver'] || csvRow['Driver'] || csvRow['driver_name'];
            if (driver) newData.driverInputs.driver = driver;

            // lap time comes from 'lap_time' or 'lap_time_secs' or we fallback to increment
            const lapTimeField = csvRow['lap_time'] || csvRow['lap_time_secs'] || csvRow['lap_time_sec'] || csvRow['lap_time_s'] || csvRow['lap_time'] || csvRow['lap_time_ms'];
            if (lapTimeField) {
                const parsed = parseFloat(lapTimeField);
                if (!isNaN(parsed)) {
                    lapTimeSeconds = parsed;
                    newData.lapTiming.currentLapTime = formatTime(lapTimeSeconds);
                }
            } else {
                // If CSV doesn't provide lap time, advance by the tick delta
                lapTimeSeconds += 0.2;
                newData.lapTiming.currentLapTime = formatTime(lapTimeSeconds);
            }

            // Map some common numeric fields if present in CSV
            const numeric = (k: string) => {
                const v = csvRow[k];
                if (v === undefined || v === null || v === '') return NaN;
                const n = Number(v);
                return Number.isFinite(n) ? n : NaN;
            };

            // pickNumeric checks several candidate keys and returns the first finite number (including 0)
            const pickNumeric = (keys: string[]) => {
                for (const k of keys) {
                    const n = numeric(k);
                    if (!Number.isNaN(n)) return n;
                }
                return NaN;
            };

            const throttle = pickNumeric(['throttle_pct', 'throttle']);
            if (!Number.isNaN(throttle)) newData.driverInputs.throttle = Math.max(0, Math.min(100, Math.round(throttle)));

            const clutch = pickNumeric(['clutch']);
            if (!Number.isNaN(clutch)) newData.driverInputs.clutch = Math.max(0, Math.min(100, Math.round(clutch)));

            const rpm = pickNumeric(['rpm']);
            if (!Number.isNaN(rpm)) newData.engine.rpm = Math.floor(Math.max(0, Math.min(20000, rpm)));

            const fuelFlow = pickNumeric(['fuel_flow_lph', 'fuel_flow']);
            if (!Number.isNaN(fuelFlow)) newData.engine.fuelFlow = Math.max(0, Math.min(2000, fuelFlow));

            const discTemp = pickNumeric(['brake_temp_front', 'brake_temp']);
            if (!Number.isNaN(discTemp)) newData.brakes.discTemp = Math.floor(Math.max(0, Math.min(2000, discTemp)));

            const padTemp = pickNumeric(['brake_temp_rear']);
            if (!Number.isNaN(padTemp)) newData.brakes.padTemp = Math.floor(Math.max(0, Math.min(2000, padTemp)));

            const surfaceTemp = pickNumeric(['tyre_temp_fl', 'tyre_temp_fr', 'tyre_temp']);
            if (!Number.isNaN(surfaceTemp)) newData.tires.surfaceTemp = Math.floor(Math.max(0, Math.min(200, surfaceTemp)));

            // Update brakes from CSV at most once per BRAKES_UPDATE_INTERVAL (1s)
            if (totalElapsedSeconds - lastBrakesUpdate >= BRAKES_UPDATE_INTERVAL) {
                const disc = pickNumeric(['brake_temp_front', 'brake_temp']);
                if (!Number.isNaN(disc)) newData.brakes.discTemp = Math.floor(Math.max(0, Math.min(2000, disc)));

                const pad = pickNumeric(['brake_temp_rear']);
                if (!Number.isNaN(pad)) newData.brakes.padTemp = Math.floor(Math.max(0, Math.min(2000, pad)));

                const pressure = pickNumeric(['brake_pressure_bar', 'brake_pressure']);
                if (!Number.isNaN(pressure)) {
                    // CSV gives brake pressure in bar; keep raw numeric value so components can render it
                    newData.brakes.brakePressure = Math.max(0, Math.min(2000, Math.round(pressure)));
                }

                const biasRaw = csvRow['brake_bias_pct'] || csvRow['brake_bias'] || csvRow['brakebias'] || csvRow['brake_bias_pct']?.toString();
                if (biasRaw) {
                    // keep as string, append % if numeric and not already
                    const bnum = Number(biasRaw as string);
                    if (!Number.isNaN(bnum)) {
                        newData.brakes.brakeBias = `${bnum}%`;
                    } else {
                        newData.brakes.brakeBias = String(biasRaw);
                    }
                }

                lastBrakesUpdate = totalElapsedSeconds;
            }

            // driver name already applied above; keep consistent
            // Update lap counter into a visible field the Header reads (positionStrategy1.stintLength used as lap in App)
            newData.positionStrategy1 = {
                ...newData.positionStrategy1,
                stintLength: lapCount,
            };

            return newData;
        }

    // Fallback random walk if no CSV iterator configured
    lapTimeSeconds += 0.2; // match the tick interval when CSV isn't present
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