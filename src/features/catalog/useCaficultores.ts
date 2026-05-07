import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchCaficultores } from './catalogService';

export function useCaficultores() {
  return useQuery({
    queryKey: catalogKeys.caficultores(),
    queryFn: fetchCaficultores,
    staleTime: 5 * 60 * 1000,
  });
}
