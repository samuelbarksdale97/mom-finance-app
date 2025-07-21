import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { CSVMapping, ParsedCSVRow, Transaction } from '@/types';

// Common bank CSV formats
export const bankFormats = {
  chase: {
    name: 'Chase Bank',
    mapping: {
      dateColumn: 'Transaction Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
    },
  },
  bankOfAmerica: {
    name: 'Bank of America',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
    },
  },
  citibank: {
    name: 'Citibank',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Debit',
    },
  },
  wellsFargo: {
    name: 'Wells Fargo',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
    },
  },
  capitalOne: {
    name: 'Capital One',
    mapping: {
      dateColumn: 'Transaction Date',
      descriptionColumn: 'Description',
      amountColumn: 'Transaction Amount',
    },
  },
  amex: {
    name: 'American Express',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
    },
  },
  usBank: {
    name: 'US Bank',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
    },
  },
  pnc: {
    name: 'PNC Bank',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Withdrawals',
    },
  },
  tdBank: {
    name: 'TD Bank',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
    },
  },
  monarch: {
    name: 'Monarch/Generic',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Merchant',
      amountColumn: 'Amount',
      rawDescriptionColumn: 'Original Statement',
    },
  },
  // Generic format that works with many banks
  generic: {
    name: 'Generic CSV',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
    },
  },
};

// Auto-detect CSV format based on headers
export const detectCSVFormat = (headers: string[]): CSVMapping | null => {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  // First, try exact matches with bank formats
  const scores: { [key: string]: number } = {};
  
  Object.entries(bankFormats).forEach(([key, format]) => {
    let score = 0;
    const mapping = format.mapping;
    
    // Check if required columns exist (case-insensitive)
    if (lowerHeaders.includes(mapping.dateColumn.toLowerCase())) score += 3;
    if (lowerHeaders.includes(mapping.descriptionColumn.toLowerCase())) score += 3;
    if (lowerHeaders.includes(mapping.amountColumn.toLowerCase())) score += 3;
    if ('rawDescriptionColumn' in mapping && (mapping as any).rawDescriptionColumn && lowerHeaders.includes((mapping as any).rawDescriptionColumn.toLowerCase())) score += 1;
    
    scores[key] = score;
  });
  
  // Find the best match
  const bestMatch = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b);
  
  if (bestMatch[1] >= 6) { // At least date, description, and amount columns found
    const format = bankFormats[bestMatch[0] as keyof typeof bankFormats];
    
    // Return actual column names (case-sensitive)
    return {
      dateColumn: headers.find(h => h.toLowerCase() === format.mapping.dateColumn.toLowerCase()) || format.mapping.dateColumn,
      descriptionColumn: headers.find(h => h.toLowerCase() === format.mapping.descriptionColumn.toLowerCase()) || format.mapping.descriptionColumn,
      amountColumn: headers.find(h => h.toLowerCase() === format.mapping.amountColumn.toLowerCase()) || format.mapping.amountColumn,
      rawDescriptionColumn: ('rawDescriptionColumn' in format.mapping && format.mapping.rawDescriptionColumn) ? 
        headers.find(h => h.toLowerCase() === (format.mapping as any).rawDescriptionColumn.toLowerCase()) : undefined,
    };
  }
  
  // If no exact match, try fuzzy matching for common patterns
  const dateColumns = headers.filter(h => 
    /date|posted|transaction.*date/i.test(h)
  );
  const descColumns = headers.filter(h => 
    /description|merchant|payee|details|name/i.test(h) && !/original/i.test(h)
  );
  const amountColumns = headers.filter(h => 
    /amount|debit|credit|withdrawal|deposit|charge/i.test(h)
  );
  
  if (dateColumns.length > 0 && descColumns.length > 0 && amountColumns.length > 0) {
    return {
      dateColumn: dateColumns[0],
      descriptionColumn: descColumns[0],
      amountColumn: amountColumns[0],
    };
  }
  
  return null;
};

// Parse date string to Date object
export const parseDate = (dateStr: string): Date => {
  // Handle various date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  ];
  
  // Try parsing with different formats
  let date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    // Try manual parsing for MM/DD/YYYY format
    const mmddyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mmddyyyy) {
      const [, month, day, year] = mmddyyyy;
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  
  return date;
};

// Parse amount string to number
export const parseAmount = (amountStr: string): number => {
  // Handle empty or null values
  if (!amountStr || amountStr.trim() === '') {
    return 0;
  }
  
  // Remove currency symbols, commas, and whitespace
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  
  // Handle parentheses as negative (accounting format)
  const isNegative = cleaned.includes('(') && cleaned.includes(')');
  const numberStr = cleaned.replace(/[()]/g, '');
  
  const amount = parseFloat(numberStr);
  
  if (isNaN(amount)) {
    throw new Error(`Invalid amount format: ${amountStr}`);
  }
  
  return isNegative ? -Math.abs(amount) : amount;
};

// Parse CSV file
export const parseCSVFile = (file: File): Promise<{ headers: string[]; data: ParsedCSVRow[]; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const errors: string[] = [];
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          errors.push(...results.errors.map(e => e.message));
        }
        
        resolve({
          headers: results.meta.fields || [],
          data: results.data as ParsedCSVRow[],
          errors,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
};

// Convert parsed CSV rows to transactions
export const convertRowsToTransactions = (
  rows: ParsedCSVRow[], 
  mapping: CSVMapping
): { transactions: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[]; errors: string[] } => {
  const transactions: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[] = [];
  const errors: string[] = [];
  
  rows.forEach((row, index) => {
    try {
      const dateStr = row[mapping.dateColumn];
      const description = row[mapping.descriptionColumn];
      const amountStr = row[mapping.amountColumn];
      
      if (!dateStr || !description || !amountStr) {
        errors.push(`Row ${index + 2}: Missing required data`);
        return;
      }
      
      const date = parseDate(dateStr);
      const amount = parseAmount(amountStr);
      const rawDescription = mapping.rawDescriptionColumn ? row[mapping.rawDescriptionColumn] : undefined;
      
      transactions.push({
        date,
        description: description.trim(),
        amount,
        rawDescription,
        originalData: row,
      });
    } catch (error) {
      errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return { transactions, errors };
};

// Parse Excel file
export const parseXLSXFile = (file: File): Promise<{ headers: string[]; data: ParsedCSVRow[]; errors: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const errors: string[] = [];
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Excel file contains no worksheets'));
          return;
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false // This ensures dates and numbers are converted to strings
        }) as string[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Excel worksheet contains no data'));
          return;
        }
        
        // First row contains headers
        const headers = jsonData[0] as string[];
        
        // Convert remaining rows to objects
        const dataRows: ParsedCSVRow[] = jsonData.slice(1).map((row) => {
          const obj: ParsedCSVRow = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        // Filter out completely empty rows
        const filteredData = dataRows.filter(row => 
          Object.values(row).some(value => value && value.toString().trim() !== '')
        );
        
        resolve({
          headers,
          data: filteredData,
          errors,
        });
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Main Excel processing function
export const processXLSXFile = async (file: File): Promise<{
  transactions: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[];
  mapping: CSVMapping | null;
  headers: string[];
  errors: string[];
}> => {
  try {
    const { headers, data, errors: parseErrors } = await parseXLSXFile(file);
    
    if (data.length === 0) {
      throw new Error('Excel file contains no data');
    }
    
    const detectedMapping = detectCSVFormat(headers);
    const allErrors = [...parseErrors];
    
    if (!detectedMapping) {
      return {
        transactions: [],
        mapping: null,
        headers,
        errors: [...allErrors, 'Could not automatically detect Excel format. Please map columns manually.'],
      };
    }
    
    const { transactions, errors: conversionErrors } = convertRowsToTransactions(data, detectedMapping);
    
    return {
      transactions,
      mapping: detectedMapping,
      headers,
      errors: [...allErrors, ...conversionErrors],
    };
  } catch (error) {
    throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Main CSV processing function
export const processCSVFile = async (file: File): Promise<{
  transactions: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[];
  mapping: CSVMapping | null;
  headers: string[];
  errors: string[];
}> => {
  try {
    const { headers, data, errors: parseErrors } = await parseCSVFile(file);
    
    if (data.length === 0) {
      throw new Error('CSV file contains no data');
    }
    
    const detectedMapping = detectCSVFormat(headers);
    const allErrors = [...parseErrors];
    
    if (!detectedMapping) {
      return {
        transactions: [],
        mapping: null,
        headers,
        errors: [...allErrors, 'Could not automatically detect CSV format. Please map columns manually.'],
      };
    }
    
    const { transactions, errors: conversionErrors } = convertRowsToTransactions(data, detectedMapping);
    
    return {
      transactions,
      mapping: detectedMapping,
      headers,
      errors: [...allErrors, ...conversionErrors],
    };
  } catch (error) {
    throw new Error(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Universal file processing function
export const processFile = async (file: File): Promise<{
  transactions: Omit<Transaction, 'id' | 'categoryId' | 'createdAt' | 'updatedAt'>[];
  mapping: CSVMapping | null;
  headers: string[];
  errors: string[];
}> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return processCSVFile(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return processXLSXFile(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel (.xlsx) file.');
  }
};