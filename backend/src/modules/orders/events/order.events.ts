export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  status: string;
  items: {
    id: string;
    itemName: string;
    stationId: string;
    stage: string;
    quantity: number;
  }[];
}
