export type { Profile } from './auth';
export type { 
  DriverLicense, 
  DriverLicenseInsert, 
  DriverLicenseUpdate 
} from './driver-license';
export type {
  Car,
  CarInsert,
  CarUpdate,
  CarImage,
  CarImageInsert,
  CarImageUpdate,
  SavedCar,
  SavedCarInsert,
  SavedCarUpdate
} from './car';
export type {
  Booking,
  BookingInsert,
  BookingUpdate,
  BookingStatus
} from './booking';
export type {
  Message,
  MessageInsert,
  MessageUpdate,
  MessageStatus
} from './message';
export type {
  Notification,
  NotificationInsert,
  NotificationUpdate,
  NotificationType
} from './notification';
export type {
  Review,
  ReviewInsert,
  ReviewUpdate,
  ReviewType
} from './review';

// Re-export common types
export type { Database } from '@/integrations/supabase/types';