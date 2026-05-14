import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from '@/features/catalog/catalogKeys';
import {
  fetchSupplyLandingConfig,
  STATIC_SUPPLY_LANDING,
} from '@/features/catalog/catalogService';

export function useSupplyLandingConfig() {
  return useQuery({
    queryKey: catalogKeys.supplyLandingConfig(),
    queryFn: fetchSupplyLandingConfig,
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_SUPPLY_LANDING,
  });
}
