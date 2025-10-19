import { DriverId } from '../types';

export interface DriverOption {
  label: string;
  value: DriverId;
}

export const DRIVER_OPTIONS: DriverOption[] = [
  { label: 'VER', value: 'driver_1' },
  { label: 'HAM', value: 'driver_44' },
  { label: 'LEC', value: 'driver_16' },
  { label: 'NOR', value: 'driver_4' },
];

export const DRIVER_LABEL_BY_ID: Record<string, string> = DRIVER_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<string, string>,
);
