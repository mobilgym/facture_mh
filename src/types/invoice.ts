export interface SubmittedInvoice {
  id: string;
  first_name: string;
  last_name: string;
  organization: string;
  email: string;
  document_date: string;
  file_url: string;
  file_name: string;
  file_size: number;
  amount?: number;
  year: string;
  month: string;
  created_at: string;
}