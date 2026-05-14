import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from '@/features/catalog/catalogKeys';
import {
  fetchMicrolotesLanding,
  STATIC_MICROLOTES,
} from '@/features/catalog/catalogService';

export function useMicrolotesLanding() {
  return useQuery({
    queryKey: catalogKeys.microlotesLanding(),
    queryFn: fetchMicrolotesLanding,
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_MICROLOTES,
  });
}
