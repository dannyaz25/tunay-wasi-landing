import { useQuery } from '@tanstack/react-query';
import { catalogKeys } from './catalogKeys';
import { fetchShippingZones, STATIC_SHIPPING_ZONES } from './catalogService';

export function useShipping() {
  return useQuery({
    queryKey: catalogKeys.shippingZones(),
    queryFn: fetchShippingZones,
    staleTime: 10 * 60 * 1000,
    placeholderData: STATIC_SHIPPING_ZONES,
  });
}
