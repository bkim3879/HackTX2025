import React, { useState, useEffect, useRef } from 'react';
import { TelemetryData, SystemAlert, AlertLevel } from '../types';
import DashboardPanel from './DashboardPanel';
import DataPoint from './DataPoint';
import RadialGauge from './RadialGauge';
import AlertIcon from './AlertIcon';

interface TelemetryGridProps {
  data: TelemetryData;
}

const TelemetryGrid: React.FC<TelemetryGridProps> = ({ data }) => {
  const {
    lapTiming, driverInputs, engine, positionStrategy1,
    fuelManagement, tires, brakes,
    suspension, aerodynamics, systemAlerts
  } = data;

  // --- Danger State Definitions ---
  const brakesDanger = brakes.discTemp > 950 || brakes.padTemp > 750;
  const tiresDanger = tires.surfaceTemp > 105;
  const alertsDanger = systemAlerts.some(alert => alert.level === AlertLevel.Error);

  // --- Flashing State Management ---
  
  // Custom logic to flash for 10 seconds only when a danger state is first entered
  const useTimedFlash = (isDanger: boolean) => {
    const [isFlashing, setIsFlashing] = useState(false);
    const prevIsDanger = useRef(false);

    useEffect(() => {
      let timer: number | undefined;
      // Trigger flashing only on the rising edge (from false to true)
      if (isDanger && !prevIsDanger.current) {
        setIsFlashing(false);
        timer = window.setTimeout(() => {
          setIsFlashing(false);
        }, 10000); // Flash for 10 seconds
      }
      // Update the ref to the current value for the next render cycle
      prevIsDanger.current = isDanger;

      return () => clearTimeout(timer);
    }, [isDanger]);
    
    return isFlashing;
  };

  const isBrakesFlashing = useTimedFlash(brakesDanger);
  const isTiresFlashing = useTimedFlash(tiresDanger);
  const isAlertsFlashing = useTimedFlash(alertsDanger);


  const Bar = ({ value, color }: { value: number; color: string }) => (
    <div className="w-16 h-2 bg-gray-700 rounded-full">
      <div className={`${color} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  );
  
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
        
        <DashboardPanel title="Lap & Timing" className="row-span-2">
            <div className="flex flex-col h-full justify-between">
                <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <p className="font-mono text-5xl font-bold text-white">{lapTiming.currentLapTime}</p>
                        <div className="text-right font-mono text-sm text-gray-400">
                            <p>S1 - {lapTiming.s1}</p>
                            <p>S2 - {lapTiming.s2}</p>
                        </div>
                    </div>
                    <DataPoint label="Best Lap" value={lapTiming.bestLap} containerClassName="py-1 border-t border-gray-700"/>
                    <DataPoint label="Gap to Ahead" value={lapTiming.gapToAhead} containerClassName="py-1 border-t border-gray-700"/>
                </div>
                 <DataPoint label={lapTiming.driverId} value={'-0,875'} containerClassName="py-1 border-t border-gray-700"/>
            </div>
        </DashboardPanel>
        
        <DashboardPanel title="Driver Inputs" className="row-span-2">
           <div className="flex items-center space-x-6 h-full">
               <RadialGauge value={driverInputs.throttle} />
               <div className="flex-grow space-y-4">
                    <div>
                        <p className="font-mono text-4xl font-bold text-white">{driverInputs.throttle.toFixed(0)}<span className="text-2xl text-gray-400">%</span></p>
                        <p className="text-sm text-gray-400">THROTTLE</p>
                    </div>
                    <div>
                        <p className="font-mono text-4xl font-bold text-white">{driverInputs.clutch.toFixed(0)}<span className="text-2xl text-gray-400">°</span></p>
                        <p className="text-sm text-gray-400">CLUTCH</p>
                    </div>
                    <p className="text-sm text-gray-400 pt-4">{driverInputs.driver}</p>
               </div>
           </div>
        </DashboardPanel>

        <DashboardPanel title="Engine / Power Unit">
          <div className="space-y-2">
            <DataPoint label="RPM" value={engine.rpm.toLocaleString()} />
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Torque</span>
              <div className="flex items-center gap-x-4">
                <Bar value={engine.torque} color="bg-cyan-400" />
                <p className="font-mono text-xl font-medium text-white w-12 text-right">420</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Fuel Flow</span>
              <div className="flex items-center gap-x-4">
                <Bar value={engine.fuelFlow} color="bg-cyan-400" />
                <p className="font-mono text-xl font-medium text-white w-12 text-right">88<span className="text-base text-gray-400 ml-1">F</span></p>
              </div>
            </div>
            <DataPoint label="Oil Pressure" value={engine.oilPressure.toFixed(1)} unit="b" />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Position & Strategy">
          <div className="space-y-2">
            <DataPoint label="Pos." value={positionStrategy1.position} />
            <DataPoint label="Pit stops" value={positionStrategy1.pitStops} />
            <DataPoint label="Stint length" value={positionStrategy1.stintLength} />
            <DataPoint label="Pit delta" value={positionStrategy1.pitDelta} />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Fuel Management">
          <div className="space-y-2">
            <DataPoint label="Fuel per Lap" value={fuelManagement.fuelPerLap.toFixed(2)} unit="kg" />
            <DataPoint label="Fuel Delta" value={fuelManagement.fuelDelta.toFixed(2)} />
            <DataPoint label="Lift-and-Coast" value={fuelManagement.liftAndCoast} unit="%" />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Tires" className={isTiresFlashing ? 'flash-danger' : ''}>
          <div className="space-y-2">
            <DataPoint label="Compound" value={tires.compound} />
            <DataPoint label="Wear Rate" value={tires.wearRate.toFixed(2)} />
            <DataPoint label="Surface Temp" value={tires.surfaceTemp} unit="c" />
            <DataPoint label="Carcass Temp" value={tires.carcassTemp} unit="G" />
          </div>
        </DashboardPanel>

        <DashboardPanel title="Brakes" className={isBrakesFlashing ? 'flash-danger' : ''}>
           <div className="space-y-2">
            <DataPoint label="Disc Temperature" value={brakes.discTemp} unit="c" />
            <DataPoint label="Pad Temp" value={brakes.padTemp} unit="c" />
            <DataPoint label="Brake Pressure" value={brakes.brakePressure} unit="%" />
            <DataPoint label="Brake Bias" value={brakes.brakeBias} />
           </div>
        {/* FIX: Corrected closing tag for DashboardPanel. */}
        </DashboardPanel>

        <DashboardPanel title="Suspension / Chassis">
          <div className="space-y-2">
            <DataPoint label="Ride Height" value={suspension.rideHeight} unit="mm" />
            <DataPoint label="Damper Travel" value={suspension.damperTravel} unit="mm" />
            <DataPoint label="Lateral Load" value={suspension.lateralLoad.toFixed(1)} unit="g" />
            <DataPoint label="Longitudinal Load" value={suspension.longitudinalLoad.toFixed(1)} unit="g" />
          </div>
        </DashboardPanel>
        
        <DashboardPanel title="Aerodynamics">
          <div className="space-y-2">
            <DataPoint label="Ride Height" value={aerodynamics.rideHeight} />
            <DataPoint label="Damper Travel" value={aerodynamics.damperTravel} unit="%" />
            <DataPoint label="Lateral Load" value={aerodynamics.lateralLoad.toFixed(1)} unit="g" />
            <DataPoint label="Longitudinal Load" value={aerodynamics.longitudinalLoad.toFixed(1)} unit="g" />
          </div>
        </DashboardPanel>

        <DashboardPanel title="System Alerts" className={isAlertsFlashing ? 'flash-danger' : ''}>
            <div className="space-y-3">
            {systemAlerts.map((alert: SystemAlert) => (
                <div key={alert.id} className="flex items-center space-x-3">
                    <AlertIcon level={alert.level} />
                    <span className="text-lg text-white">{alert.type}</span>
                </div>
            ))}
            </div>
        </DashboardPanel>

      </div>
  )
};

export default TelemetryGrid;