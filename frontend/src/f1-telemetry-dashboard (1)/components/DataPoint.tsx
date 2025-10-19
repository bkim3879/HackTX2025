
import React from 'react';

interface DataPointProps {
  label: string;
  value: string | number;
  unit?: string;
  valueClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
}

const DataPoint: React.FC<DataPointProps> = ({ 
  label, 
  value, 
  unit, 
  valueClassName = '', 
  labelClassName = '',
  containerClassName= ''
}) => {
  return (
    <div className={`flex justify-between items-baseline ${containerClassName}`}>
      <span className={`text-gray-300 ${labelClassName}`}>{label}</span>
      <p className={`font-mono text-xl font-medium text-white ${valueClassName}`}>
        {value}
        {unit && <span className="text-base text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
};

export default DataPoint;
