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
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString(undefined, {
        maximumFractionDigits: 5,
        useGrouping: false,
      })
    : value;

  return (
    <div className={`flex justify-between items-baseline ${containerClassName}`}>
      <span className={`text-gray-300 ${labelClassName}`}>{label}</span>
      <p className={`font-mono text-xl font-medium text-white ${valueClassName}`}>
        {formattedValue}
        {unit && <span className="text-base text-gray-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
};

export default DataPoint;