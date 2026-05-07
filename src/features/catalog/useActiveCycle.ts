import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchActiveCycle } from './catalogService';

export function useActiveCycle() {
  return useQuery({
    queryKey: catalogKeys.activeCycle(),
    queryFn: fetchActiveCycle,
    staleTime: 5 * 60 * 1000,
  });
}
