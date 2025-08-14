export interface Client {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  siret?: string;
  vatNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}