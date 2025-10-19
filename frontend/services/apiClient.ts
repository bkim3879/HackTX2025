import { RecommendationDTO, TelemetryTickDTO } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  DEFAULT_API_BASE_URL;

const withBase = (path: string) => {
  const trimmedBase = API_BASE_URL.replace(/\/+$/, '');
  const trimmedPath = path.replace(/^\/+/, '');
  return `${trimmedBase}/${trimmedPath}`;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchLatestTelemetry(
  raceId: string,
  driverId: string,
): Promise<TelemetryTickDTO> {
  const url = new URL(withBase('/telemetry/latest'));
  url.searchParams.set('raceId', raceId);
  url.searchParams.set('driverId', driverId);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  return handleResponse<TelemetryTickDTO>(response);
}

export async function fetchCurrentRecommendation(
  raceId: string,
  driverId: string,
): Promise<RecommendationDTO> {
  const url = new URL(withBase('/recommendation/current'));
  url.searchParams.set('raceId', raceId);
  url.searchParams.set('driverId', driverId);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  return handleResponse<RecommendationDTO>(response);
}
