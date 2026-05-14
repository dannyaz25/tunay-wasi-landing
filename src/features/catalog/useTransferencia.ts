import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchTransferencia, STATIC_TRANSFERENCIA } from './catalogService';

export function useTransferencia() {
  return useQuery({
    queryKey: catalogKeys.transferencia(),
    queryFn: fetchTransferencia,
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_TRANSFERENCIA,
  });
}
