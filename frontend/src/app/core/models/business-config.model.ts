export interface BusinessConfig {
  name: string;
  phone: string | null;
  whatsapp: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  instagramUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  shippingCost: number;
  isOpen: boolean;
  hasCapacity: boolean;
}
