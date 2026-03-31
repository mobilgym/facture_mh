import { supabase } from '../supabase';
import type { BankTransaction, RapprochementMatch, RapprochementStats } from '../../types/rapprochement';
import type { FileItem } from '../../types/file';

export class RapprochementService {

  /**
   * Upload le PDF du relevé bancaire dans Supabase Storage et retourne l'URL publique.
   */
  static async uploadBankStatementPdf(
    file: File,
    companyId: string,
    year: string,
    month: string
  ): Promise<string> {
    const path = `${companyId}/rapprochements/${year}-${month}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('test')
      .upload(path, file, { upsert: true, contentType: 'application/pdf' });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('test').getPublicUrl(path);
    return urlData.publicUrl;
  }

  /**
   * Convertit chaque page du PDF en image base64 via pdfjs-dist + canvas.
   * Ces images seront envoyées à GPT-4o Vision pour analyse.
   */
  static async pdfToImages(file: File): Promise<string[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfjsLib = await import('pdfjs-dist');

      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: string[] = [];

      // Limiter à 10 pages max pour ne pas exploser les tokens
      const maxPages = Math.min(pdf.numPages, 10);

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        // Résolution de 2x pour une bonne lisibilité par l'IA
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convertir en JPEG base64 (plus léger que PNG)
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        images.push(base64);

        // Nettoyer
        canvas.width = 0;
        canvas.height = 0;
      }

      console.log(`Converted ${images.length} PDF pages to images`);
      return images;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error('Impossible de convertir le PDF en images. Vérifiez que le fichier n\'est pas corrompu.');
    }
  }

  /**
   * Envoie les images du PDF à l'Edge Function qui appelle GPT-4o Vision.
   */
  static async analyzeWithAI(
    images: string[],
    year: string,
    month: string
  ): Promise<BankTransaction[]> {
    console.log(`Sending ${images.length} page images to AI for analysis...`);

    const { data, error } = await supabase.functions.invoke('analyze-bank-statement', {
      body: { images, year, month }
    });

    if (error) {
      throw new Error(`Erreur Edge Function: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'L\'IA n\'a pas pu analyser le relevé');
    }

    if (!data.transactions?.length) {
      throw new Error('Aucune transaction identifiée par l\'IA dans ce relevé.');
    }

    const transactions: BankTransaction[] = data.transactions.map(
      (tx: any, index: number) => ({
        id: `tx_${index + 1}`,
        date: tx.date,
        amount: Math.abs(Number(tx.amount)),
        description: tx.description || `Transaction ${index + 1}`,
        type: tx.type === 'credit' ? 'credit' as const : 'debit' as const,
        originalLine: index + 1,
        isMatched: false
      })
    );

    console.log(`AI identified ${transactions.length} transactions`);
    if (data.metadata?.bank_name) {
      console.log(`Bank: ${data.metadata.bank_name}`);
    }

    return transactions;
  }

  /**
   * Récupère les factures d'un mois donné pour une entreprise
   */
  static async getInvoicesForMonth(
    companyId: string,
    year: string,
    month: string
  ): Promise<FileItem[]> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('company_id', companyId)
        .eq('year', year)
        .eq('month', month)
        .not('amount', 'is', null)
        .order('document_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(f => ({
        id: f.id,
        name: f.name,
        type: f.type || '',
        size: f.size || 0,
        url: f.url || '',
        path: f.path || '',
        folderId: f.folder_id,
        companyId: f.company_id,
        createdAt: new Date(f.created_at),
        createdBy: f.created_by || '',
        document_date: f.document_date || '',
        amount: f.amount,
        year: f.year || year,
        month: f.month || month,
        budget_id: f.budget_id,
        badge_ids: f.badge_ids
      }));
    } catch (error) {
      console.error('Error fetching invoices for month:', error);
      throw error;
    }
  }

  /**
   * Calcule le mois précédent (ex: 03/2026 → 02/2026, 01/2026 → 12/2025)
   */
  static getPreviousMonth(year: string, month: string): { year: string; month: string } {
    let m = parseInt(month);
    let y = parseInt(year);
    m--;
    if (m < 1) { m = 12; y--; }
    return { year: String(y), month: String(m).padStart(2, '0') };
  }

  /**
   * Déplace une facture vers un autre mois (met à jour year, month, document_date)
   */
  static async moveInvoiceToMonth(
    invoiceId: string,
    targetYear: string,
    targetMonth: string,
    newDocumentDate: string
  ): Promise<void> {
    const { error } = await supabase
      .from('files')
      .update({
        year: targetYear,
        month: targetMonth,
        document_date: newDocumentDate
      })
      .eq('id', invoiceId);

    if (error) throw error;
    console.log(`Moved invoice ${invoiceId} to ${targetMonth}/${targetYear}`);
  }

  /**
   * Rapprochement automatique : compare transactions bancaires aux factures
   * avec tolérance configurable
   */
  static findMatches(
    invoices: FileItem[],
    transactions: BankTransaction[],
    tolerance: number = 0.50
  ): RapprochementMatch[] {
    const matches: RapprochementMatch[] = [];
    const usedTransactions = new Set<string>();
    const usedInvoices = new Set<string>();

    // Pass 1 : correspondances exactes (difference = 0)
    for (const invoice of invoices) {
      if (usedInvoices.has(invoice.id) || !invoice.amount) continue;

      for (const tx of transactions) {
        if (usedTransactions.has(tx.id) || tx.isMatched) continue;

        if (Math.abs(invoice.amount - tx.amount) < 0.01) {
          matches.push({
            id: crypto.randomUUID(),
            transactionId: tx.id,
            invoiceId: invoice.id,
            transactionAmount: tx.amount,
            invoiceAmount: invoice.amount,
            difference: 0,
            confidence: 'exact',
            isValidated: false,
            invoiceName: invoice.name,
            invoiceUrl: invoice.url,
            invoiceType: invoice.type,
            transactionDescription: tx.description,
            transactionDate: tx.date,
            invoiceDate: invoice.document_date
          });

          usedTransactions.add(tx.id);
          usedInvoices.add(invoice.id);
          tx.isMatched = true;
          break;
        }
      }
    }

    // Pass 2 : correspondances proches (dans la tolérance)
    for (const invoice of invoices) {
      if (usedInvoices.has(invoice.id) || !invoice.amount) continue;

      let bestMatch: { tx: BankTransaction; diff: number } | null = null;

      for (const tx of transactions) {
        if (usedTransactions.has(tx.id) || tx.isMatched) continue;

        const diff = Math.abs(invoice.amount - tx.amount);
        if (diff <= tolerance && diff > 0.01) {
          if (!bestMatch || diff < bestMatch.diff) {
            bestMatch = { tx, diff };
          }
        }
      }

      if (bestMatch) {
        matches.push({
          id: crypto.randomUUID(),
          transactionId: bestMatch.tx.id,
          invoiceId: invoice.id,
          transactionAmount: bestMatch.tx.amount,
          invoiceAmount: invoice.amount,
          difference: bestMatch.diff,
          confidence: 'close',
          isValidated: false,
          invoiceName: invoice.name,
          transactionDescription: bestMatch.tx.description,
          transactionDate: bestMatch.tx.date,
          invoiceDate: invoice.document_date
        });

        usedTransactions.add(bestMatch.tx.id);
        usedInvoices.add(invoice.id);
        bestMatch.tx.isMatched = true;
      }
    }

    console.log(`Found ${matches.length} matches (${matches.filter(m => m.confidence === 'exact').length} exact, ${matches.filter(m => m.confidence === 'close').length} close)`);
    return matches;
  }

  /**
   * Calcule les statistiques du rapprochement
   */
  static calculateStats(
    transactions: BankTransaction[],
    invoices: FileItem[],
    matches: RapprochementMatch[]
  ): RapprochementStats {
    const totalTransactions = transactions.length;
    const totalInvoices = invoices.length;
    const matchedCount = matches.length;
    const unmatchedTransactionCount = transactions.filter(t => !t.isMatched).length;
    const unmatchedInvoiceCount = totalInvoices - matches.filter(m => m.invoiceId).length;
    const totalTransactionAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const matchedAmount = matches.reduce((sum, m) => sum + m.invoiceAmount, 0);
    const matchingRate = totalInvoices > 0 ? (matchedCount / totalInvoices) * 100 : 0;

    return {
      totalTransactions,
      totalInvoices,
      matchedCount,
      unmatchedTransactionCount,
      unmatchedInvoiceCount,
      totalTransactionAmount,
      totalInvoiceAmount,
      matchedAmount,
      matchingRate
    };
  }

  /**
   * Sauvegarde un rapprochement en base de données (avec les transactions)
   */
  static async saveRapprochement(
    companyId: string,
    year: string,
    month: string,
    pdfFileName: string,
    stats: RapprochementStats,
    userId: string,
    transactions?: BankTransaction[],
    matches?: RapprochementMatch[],
    pdfUrl?: string
  ): Promise<string> {
    try {
      const existing = await this.getRapprochementForMonth(companyId, year, month);

      const payload: Record<string, any> = {
        pdf_file_name: pdfFileName,
        total_transactions: stats.totalTransactions,
        matched_count: stats.matchedCount,
        unmatched_count: stats.unmatchedTransactionCount,
        total_amount: stats.totalTransactionAmount,
        matched_amount: stats.matchedAmount,
        status: stats.matchingRate === 100 ? 'complete' : stats.matchedCount > 0 ? 'partial' : 'pending',
        validated_at: stats.matchingRate === 100 ? new Date().toISOString() : null
      };

      if (transactions) payload.transactions_data = JSON.stringify(transactions);
      if (matches) payload.matches_data = JSON.stringify(matches);
      if (pdfUrl) payload.pdf_url = pdfUrl;

      if (existing) {
        const { error } = await supabase
          .from('rapprochements')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
        return existing.id;
      }

      const { data, error } = await supabase
        .from('rapprochements')
        .insert({
          company_id: companyId,
          created_by: userId,
          year,
          month,
          ...payload,
          transactions_data: payload.transactions_data || '[]',
          matches_data: payload.matches_data || '[]'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving rapprochement:', error);
      throw error;
    }
  }

  /**
   * Charge les transactions sauvegardées d'un rapprochement existant
   */
  static async loadSavedTransactions(
    companyId: string,
    year: string,
    month: string
  ): Promise<{
    transactions: BankTransaction[];
    savedMatches: RapprochementMatch[];
    pdfFileName: string;
    record: any;
  } | null> {
    try {
      const record = await this.getRapprochementForMonth(companyId, year, month);
      if (!record || !record.transactions_data) return null;

      const rawTransactions = typeof record.transactions_data === 'string'
        ? JSON.parse(record.transactions_data)
        : record.transactions_data;

      if (!Array.isArray(rawTransactions) || rawTransactions.length === 0) return null;

      const transactions: BankTransaction[] = rawTransactions.map(
        (tx: any, index: number) => ({
          id: tx.id || `tx_${index + 1}`,
          date: tx.date,
          amount: Math.abs(Number(tx.amount)),
          description: tx.description || `Transaction ${index + 1}`,
          type: tx.type === 'credit' ? 'credit' as const : 'debit' as const,
          originalLine: tx.originalLine || index + 1,
          isMatched: false
        })
      );

      // Charger les matches sauvegardés
      let savedMatches: RapprochementMatch[] = [];
      if (record.matches_data) {
        const rawMatches = typeof record.matches_data === 'string'
          ? JSON.parse(record.matches_data)
          : record.matches_data;
        if (Array.isArray(rawMatches)) {
          savedMatches = rawMatches;
        }
      }

      return {
        transactions,
        savedMatches,
        pdfFileName: record.pdf_file_name || 'releve.pdf',
        pdfUrl: record.pdf_url || null,
        record
      };
    } catch (error) {
      console.error('Error loading saved transactions:', error);
      return null;
    }
  }

  /**
   * Crée une facture virtuelle à partir d'une transaction bancaire non rapprochée.
   * Préfixe ACH (débit/-) ou VTE (crédit/+) + description.
   */
  static async createInvoiceFromTransaction(
    transaction: BankTransaction,
    companyId: string,
    userId: string,
    year: string,
    month: string
  ): Promise<string> {
    try {
      const prefix = transaction.type === 'debit' ? 'ACH' : 'VTE';
      const cleanDesc = transaction.description
        .replace(/[\/\\:*?"<>|]/g, ' ')
        .trim()
        .substring(0, 80);
      const fileName = `${prefix} - ${cleanDesc}.pdf`;

      const documentDate = new Date(transaction.date);
      if (isNaN(documentDate.getTime())) {
        documentDate.setFullYear(parseInt(year), parseInt(month) - 1, 1);
      }

      const { data, error } = await supabase
        .from('files')
        .insert({
          name: fileName,
          type: 'manual/invoice',
          size: 0,
          url: null,
          path: null,
          folder_id: null,
          company_id: companyId,
          created_by: userId,
          document_date: documentDate.toISOString(),
          year,
          month,
          amount: transaction.amount
        })
        .select('id')
        .single();

      if (error) throw error;
      console.log(`Created invoice "${fileName}" (${transaction.amount}) -> ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('Error creating invoice from transaction:', error);
      throw error;
    }
  }

  /**
   * Crée plusieurs factures à partir de transactions non rapprochées
   */
  static async createInvoicesFromTransactions(
    transactions: BankTransaction[],
    companyId: string,
    userId: string,
    year: string,
    month: string
  ): Promise<number> {
    let created = 0;
    for (const tx of transactions) {
      try {
        await this.createInvoiceFromTransaction(tx, companyId, userId, year, month);
        created++;
      } catch (error) {
        console.warn(`Failed to create invoice for tx ${tx.id}:`, error);
      }
    }
    return created;
  }

  /**
   * Récupère le dernier rapprochement pour un mois donné
   */
  static async getRapprochementForMonth(
    companyId: string,
    year: string,
    month: string
  ): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('rapprochements')
        .select('*')
        .eq('company_id', companyId)
        .eq('year', year)
        .eq('month', month)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching rapprochement:', error);
      return null;
    }
  }
}
