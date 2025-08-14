export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  folderId: string | null;
  companyId: string;
  createdAt: Date;
  createdBy: string;
  document_date: string;
  amount?: number | null;
  year: string;
  month: string;
}