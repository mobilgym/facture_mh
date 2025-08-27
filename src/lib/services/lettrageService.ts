import { supabase } from '../supabase';
import type { CsvPayment, LettrageMatch, LettrageState } from '../../types/lettrage';
import type { FileItem } from '../../types/file';

export class LettrageService {
  
  /**
   * Parse un fichier CSV avec mapping personnalisé des colonnes
   */
  static async parseCsvFileWithMapping(
    headers: string[], 
    allRows: string[][], 
    mapping: { dateColumn: number; amountColumn: number; descriptionColumn: number | null }
  ): Promise<CsvPayment[]> {
    try {
      const payments: CsvPayment[] = [];
      
      // Ignorer la première ligne (headers) et traiter les données
      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i];
        
        if (row.length > Math.max(mapping.dateColumn, mapping.amountColumn)) {
          const dateStr = row[mapping.dateColumn]?.trim();
          const amountStr = row[mapping.amountColumn]?.trim();
          const description = mapping.descriptionColumn !== null 
            ? row[mapping.descriptionColumn]?.trim() 
            : `Paiement ligne ${i}`;

          if (dateStr && amountStr) {
            const cleanAmountStr = amountStr.replace(/[^\d.,-]/g, '').replace(',', '.');
            const amount = parseFloat(cleanAmountStr);
            
            if (!isNaN(amount)) {
              try {
                const parsedDate = this.parseDate(dateStr);
                payments.push({
                  id: `csv_${i}`,
                  date: parsedDate,
                  amount: Math.abs(amount),
                  originalRow: i,
                  description: description || `Paiement ligne ${i}`,
                  isMatched: false
                });
              } catch (error) {
                console.warn(`⚠️ Erreur parsing date ligne ${i}:`, dateStr, error);
              }
            }
          }
        }
      }

      console.log(`✅ CSV parsé avec mapping: ${payments.length} paiements trouvés`);
      return payments;
      
    } catch (error) {
      console.error('❌ Erreur lors du parsing CSV avec mapping:', error);
      throw error;
    }
  }

  /**
   * Parse un fichier CSV et extrait les paiements (méthode legacy avec auto-détection)
   */
  static async parseCsvFile(file: File): Promise<CsvPayment[]> {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Le fichier CSV est vide');
      }

      // Analyser l'en-tête avec plus de flexibilité
      const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      console.log('📋 Headers détectés:', headers);
      
      const dateIndex = headers.findIndex(h => 
        h.includes('date') || 
        h.includes('datum') || 
        h.includes('jour') ||
        h === 'date'
      );
      
      const amountIndex = headers.findIndex(h => 
        h.includes('montant') || 
        h.includes('amount') || 
        h.includes('prix') ||
        h.includes('valeur') ||
        h.includes('somme') ||
        h === 'montant' ||
        h === 'amount'
      );
      
      console.log(`🔍 Index trouvés - Date: ${dateIndex}, Montant: ${amountIndex}`);
      
      if (dateIndex === -1 || amountIndex === -1) {
        const availableHeaders = headers.join(', ');
        throw new Error(`Colonnes requises manquantes: "date" et "montant". Colonnes disponibles: ${availableHeaders}`);
      }

      const payments: CsvPayment[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/['"]/g, ''));
        
        if (values.length >= Math.max(dateIndex, amountIndex) + 1) {
          const dateStr = values[dateIndex];
          const amountStr = values[amountIndex].replace(/[^\d.,-]/g, '').replace(',', '.');
          const amount = parseFloat(amountStr);
          
          console.log(`📄 Ligne ${i}: Date="${dateStr}", Montant="${amountStr}" → ${amount}`);
          
          if (!isNaN(amount) && dateStr) {
            try {
              const parsedDate = this.parseDate(dateStr);
              payments.push({
                id: `csv_${i}`,
                date: parsedDate,
                amount: Math.abs(amount), // Toujours positif pour comparaison
                originalRow: i,
                description: values.slice(2).join(' ').trim() || `Paiement ligne ${i}`,
                isMatched: false
              });
            } catch (error) {
              console.warn(`⚠️ Erreur parsing date ligne ${i}:`, dateStr, error);
            }
          } else {
            console.warn(`⚠️ Ligne ${i} ignorée - Date: "${dateStr}", Montant: ${amount}`);
          }
        } else {
          console.warn(`⚠️ Ligne ${i} - Pas assez de colonnes: ${values.length} < ${Math.max(dateIndex, amountIndex) + 1}`);
        }
      }

      console.log(`✅ CSV parsé: ${payments.length} paiements trouvés`);
      return payments;
      
    } catch (error) {
      console.error('❌ Erreur lors du parsing CSV:', error);
      throw error;
    }
  }

  /**
   * Parse différents formats de date
   */
  private static parseDate(dateStr: string): string {
    try {
      // Formats supportés: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
      const cleanDate = dateStr.replace(/[^\d\/\-]/g, '');
      
      let date: Date;
      
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts[2] && parts[2].length === 4) {
          // DD/MM/YYYY
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        } else {
          // MM/DD/YYYY
          date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
      } else if (cleanDate.includes('-')) {
        const parts = cleanDate.split('-');
        if (parts[0] && parts[0].length === 4) {
          // YYYY-MM-DD
          date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          // DD-MM-YYYY
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      } else {
        throw new Error('Format de date non reconnu');
      }

      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('⚠️ Date non parsable:', dateStr);
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Récupère les factures non lettrées pour une période donnée
   */
  static async getUnmatchedInvoices(
    companyId: string, 
    startDate: string, 
    endDate: string
  ): Promise<FileItem[]> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('company_id', companyId)
        .gte('document_date', startDate)
        .lte('document_date', endDate)
        .is('lettrage_match_id', null) // Non lettrées
        .not('amount', 'is', null) // Avec montant
        .order('document_date', { ascending: false });

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} factures non lettrées trouvées`);
      return data || [];
    } catch (error) {
      console.error('❌ Erreur récupération factures:', error);
      throw error;
    }
  }

  /**
   * Comparaison automatique des montants avec tolérance
   */
  static findAutomaticMatches(
    invoices: FileItem[], 
    payments: CsvPayment[], 
    tolerance: number = 0.01
  ): LettrageMatch[] {
    const matches: LettrageMatch[] = [];
    const usedPayments = new Set<string>();
    const usedInvoices = new Set<string>();

    for (const invoice of invoices) {
      if (usedInvoices.has(invoice.id) || !invoice.amount) continue;

      for (const payment of payments) {
        if (usedPayments.has(payment.id) || payment.isMatched) continue;

        const difference = Math.abs(invoice.amount - payment.amount);
        
        if (difference <= tolerance) {
          matches.push({
            id: crypto.randomUUID(),
            invoiceId: invoice.id,
            paymentId: payment.id,
            invoiceAmount: invoice.amount,
            paymentAmount: payment.amount,
            difference,
            isAutomatic: true,
            isValidated: false,
            createdAt: new Date().toISOString()
          });

          usedPayments.add(payment.id);
          usedInvoices.add(invoice.id);
          payment.isMatched = true;
          break;
        }
      }
    }

    console.log(`✅ ${matches.length} correspondances automatiques trouvées`);
    return matches;
  }

  /**
   * Sauvegarde un lettrage validé en base
   */
  static async saveLettrageMatch(match: LettrageMatch, companyId: string, userId?: string): Promise<void> {
    try {
      // Créer l'enregistrement de lettrage
      const { data: lettrageData, error: lettrageError } = await supabase
        .from('lettrage_matches')
        .insert({
          invoice_id: match.invoiceId,
          payment_id: match.paymentId,
          invoice_amount: match.invoiceAmount,
          payment_amount: match.paymentAmount,
          difference: match.difference,
          is_automatic: match.isAutomatic,
          is_validated: true,
          validated_at: new Date().toISOString(),
          company_id: companyId,
          created_by: userId
        })
        .select()
        .single();

      if (lettrageError) throw lettrageError;

      // Mettre à jour la facture avec l'ID de lettrage
      const { error: updateError } = await supabase
        .from('files')
        .update({ 
          lettrage_match_id: lettrageData.id,
          is_lettree: true,
          lettrage_date: new Date().toISOString()
        })
        .eq('id', match.invoiceId);

      if (updateError) throw updateError;

      console.log(`✅ Lettrage sauvegardé: ${match.id}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde lettrage:', error);
      throw error;
    }
  }

  /**
   * Annule un lettrage existant
   */
  static async cancelLettrage(matchId: string, invoiceId: string): Promise<void> {
    try {
      // Supprimer l'enregistrement de lettrage
      const { error: deleteError } = await supabase
        .from('lettrage_matches')
        .delete()
        .eq('id', matchId);

      if (deleteError) throw deleteError;

      // Remettre la facture comme non lettrée
      const { error: updateError } = await supabase
        .from('files')
        .update({ 
          lettrage_match_id: null,
          is_lettree: false,
          lettrage_date: null
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      console.log(`✅ Lettrage annulé: ${matchId}`);
    } catch (error) {
      console.error('❌ Erreur annulation lettrage:', error);
      throw error;
    }
  }

  /**
   * Recherche dans les paiements CSV
   */
  static searchInCsvPayments(payments: CsvPayment[], query: string): CsvPayment[] {
    if (!query.trim()) return payments;
    
    const searchTerm = query.toLowerCase();
    return payments.filter(payment => 
      payment.amount.toString().includes(searchTerm) ||
      payment.date.includes(searchTerm) ||
      payment.description?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Calcule les statistiques de lettrage
   */
  static calculateLettrageStats(
    invoices: FileItem[], 
    payments: CsvPayment[], 
    matches: LettrageMatch[]
  ) {
    const totalInvoices = invoices.length;
    const totalPayments = payments.length;
    const matchedInvoices = matches.length;
    const matchedPayments = matches.length;
    
    const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPaymentAmount = payments.reduce((sum, pay) => sum + pay.amount, 0);
    const matchedAmount = matches.reduce((sum, match) => sum + match.invoiceAmount, 0);
    
    return {
      totalInvoices,
      totalPayments,
      matchedInvoices,
      matchedPayments,
      unmatchedInvoices: totalInvoices - matchedInvoices,
      unmatchedPayments: totalPayments - matchedPayments,
      totalInvoiceAmount,
      totalPaymentAmount,
      matchedAmount,
      unmatchedInvoiceAmount: totalInvoiceAmount - matchedAmount,
      matchingRate: totalInvoices > 0 ? (matchedInvoices / totalInvoices) * 100 : 0
    };
  }
}
