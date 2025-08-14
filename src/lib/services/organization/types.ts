export interface FileOrganizationOptions {
  year: string;
  month: string;
  monthName: string;
}

export interface OrganizedFile {
  id: string;
  path: string;
  newPath: string;
  date: Date;
}