export interface Company {
  id: string;
  name: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  companies: string[]; // IDs des sociétés auxquelles l'utilisateur a accès
}