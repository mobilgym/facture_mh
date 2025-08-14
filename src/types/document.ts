export interface CompanySettings {
  id: string;
  companyId: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  siret?: string;
  vatNumber?: string;
  legalAddress?: string;
  paymentDetails?: string;
  termsAndConditions?: string;
  documentPrefix?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentTemplate {
  id: string;
  companyId: string;
  name: string;
  type: 'invoice' | 'quote';
  layout: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentItem {
  id: string;
  documentType: 'invoice' | 'quote';
  documentId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  discountRate?: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTerms {
  id: string;
  companyId: string;
  name: string;
  daysDue: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BaseDocument {
  id: string;
  companyId: string;
  templateId?: string;
  number: string;
  clientName: string;
  clientAddress?: string;
  clientEmail?: string;
  issueDate: Date;
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discountRate?: number;
  discountAmount?: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice extends BaseDocument {
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
}

export interface Quote extends BaseDocument {
  validityDate: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
}