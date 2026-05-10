import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchYapePlin, STATIC_YAPE_PLIN } from './catalogService';

export function useYapePlin() {
  return useQuery({
    queryKey: catalogKeys.yapePlin(),
    queryFn: fetchYapePlin,
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_YAPE_PLIN,
  });
}
