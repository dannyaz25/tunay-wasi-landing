import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchLandingConfig, STATIC_LANDING_CONFIG } from './catalogService';

export function useLandingConfig() {
  return useQuery({
    queryKey: catalogKeys.landingConfig(),
    queryFn: fetchLandingConfig,
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_LANDING_CONFIG,
  });
}
