export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  categoryId: string | null;
  rawDescription?: string;
  originalData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CSVMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  rawDescriptionColumn?: string;
}

export interface ParsedCSVRow {
  [key: string]: string;
}

export interface UndoAction {
  type: 'move' | 'delete' | 'rename';
  originalData: any;
  timestamp: number;
}