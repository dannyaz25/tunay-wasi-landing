import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchProductos } from './catalogService';

export function useCatalog() {
  return useQuery({
    queryKey: catalogKeys.products(),
    queryFn: fetchProductos,
    staleTime: 5 * 60 * 1000,
  });
}
