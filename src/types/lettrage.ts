export interface CsvPayment {
  id: string;
  date: string;
  amount: number;
  originalRow: number;
  description?: string;
  isMatched: boolean;
}

export interface LettrageMatch {
  id: string;
  invoiceId: string;
  paymentId: string;
  invoiceAmount: number;
  paymentAmount: number;
  difference: number;
  isAutomatic: boolean;
  isValidated: boolean;
  createdAt: string;
  validatedAt?: string;
}

export interface LettrageState {
  csvPayments: CsvPayment[];
  unmatchedInvoices: any[];
  unmatchedPayments: CsvPayment[];
  matches: LettrageMatch[];
  isLoading: boolean;
  selectedPeriod: {
    startDate: string;
    endDate: string;
  };
}

export interface DragPoint {
  id: string;
  type: 'invoice' | 'payment';
  amount: number;
  date: string;
  description: string;
  position: { x: number; y: number };
  isConnected: boolean;
  connectedTo?: string;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
  fromType: 'invoice' | 'payment';
  toType: 'invoice' | 'payment';
  isValid: boolean;
  difference: number;
}
