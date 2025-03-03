
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
}
