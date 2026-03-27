import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getOrdersByStation, type Order } from '../../../api/orders.api';
import { useOfflineStore } from '../../../stores/offlineStore';

export function useStationOrders(stationId: string | null) {
  const cachedOrders = useOfflineStore((s) => s.cachedOrders);
  const setCachedOrders = useOfflineStore((s) => s.setCachedOrders);
  const setLastSyncTimestamp = useOfflineStore((s) => s.setLastSyncTimestamp);

  const query = useQuery<Order[]>({
    queryKey: ['station-orders', stationId],
    queryFn: () => getOrdersByStation(stationId!),
    enabled: !!stationId,
    refetchInterval: 30_000,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
    placeholderData: cachedOrders.length > 0 ? cachedOrders : undefined,
    select: (data) =>
      [...data].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
  });

  // Persist fresh data to offline cache
  useEffect(() => {
    if (query.data && query.data.length > 0 && !query.isPlaceholderData) {
      setCachedOrders(query.data);
      setLastSyncTimestamp(new Date().toISOString());
    }
  }, [query.data, query.isPlaceholderData, setCachedOrders, setLastSyncTimestamp]);

  return query;
}
