
export interface Invoice {
  id: string;
  created_at: string;
  invoice_uid: string;
  payment_link: string;
  status: string;
  price: number;
  room_type: string;
  checkin: string;
  checkout: string;
  first_name: string;
  last_name: string;
  email: string;
  due_date: string;
  last_reminder_sent?: string | null;
  reminder_count?: number;
  profile_id?: string;
  imported?: boolean;
  paid_at?: string | null;
  request_invoice_id?: string;
  payment_type?: string;
  booking_details?: any;
  profile?: {
    team?: {
      id: string;
      name: string;
      color?: string;
      logo_url: string | null;
    } | null;
  } | null;
}
