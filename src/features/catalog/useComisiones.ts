import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchComisiones, STATIC_COMISIONES } from './catalogService';

export function useComisiones() {
  return useQuery({
    queryKey: catalogKeys.comisiones(),
    queryFn: fetchComisiones,
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_COMISIONES,
  });
}
