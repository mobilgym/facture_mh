export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  originalLine: number;
  isMatched: boolean;
  matchedInvoiceId?: string;
}

export interface RapprochementMatch {
  id: string;
  transactionId: string;
  invoiceId: string;
  transactionAmount: number;
  invoiceAmount: number;
  difference: number;
  confidence: 'exact' | 'close' | 'manual';
  isValidated: boolean;
  invoiceName?: string;
  invoiceUrl?: string;
  invoiceType?: string;
  transactionDescription?: string;
  transactionDate?: string;
  invoiceDate?: string;
}

export interface RapprochementState {
  transactions: BankTransaction[];
  matches: RapprochementMatch[];
  unmatchedTransactions: BankTransaction[];
  unmatchedInvoices: any[];
  isLoading: boolean;
  isParsing: boolean;
  step: 'upload' | 'parsing' | 'results' | 'validated';
  stats: RapprochementStats;
  pdfFileName?: string;
  pdfUrl?: string | null;
}

export interface RapprochementStats {
  totalTransactions: number;
  totalInvoices: number;
  matchedCount: number;
  unmatchedTransactionCount: number;
  unmatchedInvoiceCount: number;
  totalTransactionAmount: number;
  totalInvoiceAmount: number;
  matchedAmount: number;
  matchingRate: number;
}

export interface RapprochementRecord {
  id: string;
  company_id: string;
  year: string;
  month: string;
  pdf_file_name: string;
  total_transactions: number;
  matched_count: number;
  unmatched_count: number;
  total_amount: number;
  matched_amount: number;
  status: 'pending' | 'partial' | 'complete';
  created_by: string;
  created_at: string;
  validated_at?: string;
}
