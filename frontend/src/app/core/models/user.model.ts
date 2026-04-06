import { UserRole } from './auth.model';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  betweenStreets: string | null;
  apartmentInfo: string | null;
  deliveryNotes: string | null;
  role: UserRole;
}
