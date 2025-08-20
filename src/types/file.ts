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
  budget_id?: string | null;
  badge_ids?: string[] | null;
  // Deprecated: will be removed
  expense_category_id?: string | null;
}