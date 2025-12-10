export interface PlaceOrderDTO {
  orderId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
  }[];
}
