export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  related_car_id?: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
}