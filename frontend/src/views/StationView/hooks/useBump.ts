import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bumpOrder, type Order } from '../../../api/orders.api';
import { useOfflineStore } from '../../../stores/offlineStore';

export function useBump(stationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const isOffline = useOfflineStore.getState().isOffline;
      if (isOffline) {
        useOfflineStore.getState().queueBump(orderId, stationId ?? '');
        return null;
      }
      return bumpOrder(orderId);
    },
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({
        queryKey: ['station-orders', stationId],
      });
      const previousOrders = queryClient.getQueryData<Order[]>([
        'station-orders',
        stationId,
      ]);

      queryClient.setQueryData<Order[]>(
        ['station-orders', stationId],
        (old) =>
          old?.map((o) =>
            o.id === orderId
              ? { ...o, status: 'bumped', _offlineQueued: useOfflineStore.getState().isOffline }
              : o,
          ) ?? [],
      );

      return { previousOrders };
    },
    onError: (_err, orderId, context) => {
      // On network error, queue the bump for later
      useOfflineStore.getState().queueBump(orderId, stationId ?? '');
      if (context?.previousOrders) {
        queryClient.setQueryData(
          ['station-orders', stationId],
          context.previousOrders,
        );
      }
    },
    onSettled: () => {
      const isOffline = useOfflineStore.getState().isOffline;
      if (!isOffline) {
        queryClient.invalidateQueries({
          queryKey: ['station-orders', stationId],
        });
      }
    },
  });
}
