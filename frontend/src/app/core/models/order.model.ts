export interface CartItem {
  productId: number;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  customizations: CartCustomization[];
  observations: string | null;
}

export interface CartCustomization {
  groupId: number;
  groupName: string;
  optionId: number;
  optionName: string;
  optionQuantity: number;
  priceModifier: number;
}

export interface CreateOrderItemRequest {
  productId: number;
  variantId: number | null;
  quantity: number;
  observations: string | null;
  customizations: { groupId: number; optionId: number; optionQuantity: number }[];
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryBetweenStreets: string | null;
  deliveryApartment: string | null;
  deliveryNotes: string | null;
  paymentMethod: PaymentMethod;
  cashAmount: number | null;
  discountCode: string | null;
}

export interface Order {
  id: number;
  orderCode: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashAmount: number | null;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryBetweenStreets: string | null;
  deliveryApartment: string | null;
  deliveryNotes: string | null;
  whatsappMessage: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface OrderItem {
  id: number;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  observations: string | null;
  customizations: OrderItemCustomization[];
}

export interface OrderItemCustomization {
  groupName: string;
  optionName: string;
  optionQuantity: number;
  priceModifier: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'OnTheWay' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'Transfer';
