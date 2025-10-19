import React, { useState, useEffect } from 'react';
import { TelemetryData, AdvancedAIPredictionsData, SystemAlert } from '../types';
import DashboardPanel from './DashboardPanel';
import DataPoint from './DataPoint';
import LineGraph from './LineGraph';

interface TelemetryGridProps {
  telemetry: TelemetryData;
  predictions: AdvancedAIPredictionsData;
  alerts: SystemAlert[];
}

const getActionColor = (action: string) => {
    if (action.includes('PIT')) return 'text-red-300';
    if (action.includes('EXTEND')) return 'text-yellow-300';
    if (action.includes('MAINTAIN')) return 'text-green-300';
    return 'text-gray-300';
}


const TelemetryGrid: React.FC<TelemetryGridProps> = ({ telemetry, predictions, alerts }) => {
  const [throttleHistory, setThrottleHistory] = useState<number[]>([]);

  useEffect(() => {
    setThrottleHistory((prev) => {
      const newHistory = [...prev, telemetry.driverInputs.throttle];
      return newHistory.length > 50 ? newHistory.slice(1) : newHistory;
    });
  }, [telemetry.driverInputs.throttle]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <DashboardPanel title="Lap Timing">
        <div className="space-y-2">
          <DataPoint label="Driver" value={telemetry.lapTiming.driverId} />
          <DataPoint label="Current Lap" value={telemetry.lapTiming.currentLapTime} valueClassName="text-cyan-400" />
          <DataPoint label="Sector 1" value={telemetry.lapTiming.s1} />
          <DataPoint label="Sector 2" value={telemetry.lapTiming.s2} />
          <DataPoint label="Best Lap" value={telemetry.lapTiming.bestLap} valueClassName="text-green-400" />
          <div className="border-t border-dashed border-white/20 pt-2 mt-2">
            <DataPoint label="Predicted Lap" value={predictions.predictedLapTime.toFixed(3)} unit="s" labelClassName="text-cyan-300" valueClassName="text-cyan-300" />
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title={`Driver: ${telemetry.driverInputs.driver}`}>
        <div className="space-y-2">
           <DataPoint label="Throttle" value={telemetry.driverInputs.throttle.toFixed(1)} unit="%" />
           <DataPoint label="Clutch" value={telemetry.driverInputs.clutch.toFixed(1)} unit="%" />
        </div>
        <div className="mt-4 flex-grow flex flex-col">
            <span className="text-xs text-gray-400">Throttle Trace</span>
            <div className="flex-grow min-h-[60px]">
                <LineGraph data={throttleHistory} strokeColor="#34D399" />
            </div>
        </div>
      </DashboardPanel>

      <DashboardPanel title="Aero / Suspension">
        <div className="space-y-2">
            <DataPoint label="Ride Height" value={telemetry.suspension.rideHeight.toFixed(1)} unit="mm" />
            <DataPoint label="Damper Travel" value={telemetry.suspension.damperTravel.toFixed(1)} unit="mm" />
            <DataPoint label="Lateral Load" value={telemetry.suspension.lateralLoad.toFixed(2)} unit="G" />
            <DataPoint label="Longitudinal Load" value={telemetry.suspension.longitudinalLoad.toFixed(2)} unit="G" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Engine">
        <div className="space-y-2">
            <DataPoint label="RPM" value={telemetry.engine.rpm.toLocaleString()} />
            <DataPoint label="Torque" value={telemetry.engine.torque.toFixed(1)} unit="Nm" />
            <DataPoint label="Fuel Flow" value={telemetry.engine.fuelFlow.toFixed(2)} unit="kg/hr" />
            <DataPoint label="Oil Pressure" value={telemetry.engine.oilPressure.toFixed(2)} unit="bar" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Position & Strategy">
          <div className="space-y-2">
            <DataPoint label="Position" value={telemetry.positionStrategy1.position} />
            <DataPoint label="Pit Stops" value={telemetry.positionStrategy1.pitStops} />
            <DataPoint label="Stint Length" value={telemetry.positionStrategy1.stintLength} unit="laps" />
            <div className="border-t border-dashed border-white/20 pt-2 mt-2 space-y-2">
              <div className="flex justify-between items-baseline">
                  <span className="text-gray-300 text-cyan-300">Best Action</span>
                  <p className={`font-mono text-xl font-medium ${getActionColor(predictions.bestAction)}`}>
                      {predictions.bestAction === 'MAINTAIN_PACE' ? 
                          <span className="text-base">maintain pace</span> : 
                          predictions.bestAction.replace('_', ' ')
                      }
                  </p>
              </div>
              <DataPoint label="Confidence" value={`${(predictions.confidence * 100).toFixed(0)}%`} labelClassName="text-cyan-300" valueClassName="text-cyan-300" />
            </div>
          </div>
      </DashboardPanel>
      
      <DashboardPanel title="Fuel Management">
        <div className="space-y-2">
          <DataPoint label="Fuel / Lap" value={telemetry.fuelManagement.fuelPerLap.toFixed(2)} unit="kg" />
          <DataPoint label="Fuel Delta" value={telemetry.fuelManagement.fuelDelta.toFixed(2)} unit="kg" />
          <DataPoint label="Lift & Coast" value={telemetry.fuelManagement.liftAndCoast.toFixed(1)} unit="%" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Tires">
        <div className="space-y-2">
          <DataPoint label="Compound" value={telemetry.tires.compound} />
          <DataPoint label="Wear Rate" value={telemetry.tires.wearRate.toFixed(3)} unit="%/lap" />
          <DataPoint label="Surface Temp" value={telemetry.tires.surfaceTemp.toFixed(1)} unit="°C" />
          <DataPoint label="Carcass Temp" value={telemetry.tires.carcassTemp.toFixed(1)} unit="°C" />
        </div>
      </DashboardPanel>

      <DashboardPanel title="Brakes">
        <div className="space-y-2">
          <DataPoint label="Disc Temp" value={telemetry.brakes.discTemp} unit="°C" />
          <DataPoint label="Pad Temp" value={telemetry.brakes.padTemp} unit="°C" />
          <DataPoint label="Pressure" value={telemetry.brakes.brakePressure} unit="bar" />
          <DataPoint label="Bias" value={telemetry.brakes.brakeBias} />
        </div>
      </DashboardPanel>
    </div>
  );
};

export default TelemetryGrid;
