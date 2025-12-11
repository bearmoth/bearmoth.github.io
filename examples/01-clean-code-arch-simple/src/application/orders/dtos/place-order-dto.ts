export interface PlaceOrderDTO {
  orderId: string;
  customerId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
  }[];
}
