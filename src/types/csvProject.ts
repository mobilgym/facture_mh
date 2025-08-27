export interface CsvProject {
  id: string;
  name: string;
  description?: string;
  project_date: string; // Date spécifique du projet (YYYY-MM-DD)
  csv_file_name: string;
  csv_data: string; // JSON stringifié des données CSV
  csv_headers: string[]; // En-têtes du CSV
  column_mapping: {
    dateColumn: number;
    amountColumn: number;
    descriptionColumn: number | null;
  };
  lettrage_state: string; // JSON stringifié de l'état du lettrage
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  company_id: string;
}

export interface CsvProjectCreate {
  name: string;
  description?: string;
  project_date: string;
  csv_file_name: string;
  csv_data: string;
  csv_headers: string[];
  column_mapping: {
    dateColumn: number;
    amountColumn: number;
    descriptionColumn: number | null;
  };
  lettrage_state?: string;
}

export interface CsvProjectUpdate {
  name?: string;
  description?: string;
  project_date?: string;
  lettrage_state?: string;
  is_completed?: boolean;
}

export interface CsvProjectListItem {
  id: string;
  name: string;
  description?: string;
  project_date: string;
  csv_file_name: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  total_payments: number;
  matched_count: number;
  unmatched_count: number;
}
