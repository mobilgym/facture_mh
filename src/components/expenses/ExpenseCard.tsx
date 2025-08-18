import React from 'react';
import { Edit, Trash2, FileText, Calendar, DollarSign, Tag, Building, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { ExpenseWithDetails } from '../../types/budget';

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  onEdit: (expense: ExpenseWithDetails) => void;
  onDelete: (expenseId: string) => void;
  onApprove?: (expenseId: string) => void;
  onMarkAsPaid?: (expenseId: string) => void;
  onClick?: (expense: ExpenseWithDetails) => void;
}

export function ExpenseCard({ 
  expense, 
  onEdit, 
  onDelete, 
  onApprove, 
  onMarkAsPaid, 
  onClick 
}: ExpenseCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(expense);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(expense);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(expense.id);
  };

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApprove) {
      onApprove(expense.id);
    }
  };

  const handleMarkAsPaid = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsPaid) {
      onMarkAsPaid(expense.id);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusColor = () => {
    switch (expense.status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (expense.status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusLabel = () => {
    switch (expense.status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'paid': return 'Payée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnu';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      cash: 'Espèces',
      check: 'Chèque',
      bank_transfer: 'Virement',
      card: 'Carte',
      other: 'Autre'
    };
    return methods[method as keyof typeof methods] || method;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="p-6">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {expense.file ? (
                <FileText className="h-5 w-5 text-blue-600" />
              ) : (
                <DollarSign className="h-5 w-5 text-green-600" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {expense.title}
              </h3>
            </div>
            {expense.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {expense.description}
              </p>
            )}
          </div>
          
          {/* Statut */}
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusLabel()}</span>
          </span>
        </div>

        {/* Montant et Date */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Montant
            </p>
            <p className="text-xl font-bold text-gray-900">
              {formatAmount(expense.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Date
            </p>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
              <p className="text-sm font-semibold text-gray-900">
                {formatDate(expense.expense_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="space-y-2 mb-4">
          {/* Budget */}
          {expense.budget && (
            <div className="flex items-center text-sm text-gray-600">
              <Building className="h-4 w-4 mr-2" />
              <span className="font-medium">Budget:</span>
              <span className="ml-1">{expense.budget.name}</span>
            </div>
          )}

          {/* Poste de dépense */}
          {expense.expense_category && (
            <div className="flex items-center text-sm text-gray-600">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: expense.expense_category.color }}
              />
              <span className="font-medium">Poste:</span>
              <span className="ml-1">{expense.expense_category.name}</span>
            </div>
          )}

          {/* Fournisseur */}
          {expense.vendor && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Fournisseur:</span>
              <span className="ml-1">{expense.vendor}</span>
            </div>
          )}

          {/* Méthode de paiement */}
          {expense.payment_method && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Paiement:</span>
              <span className="ml-1">{getPaymentMethodLabel(expense.payment_method)}</span>
            </div>
          )}

          {/* Numéro de référence */}
          {expense.reference_number && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Référence:</span>
              <span className="ml-1">{expense.reference_number}</span>
            </div>
          )}

          {/* Fichier attaché */}
          {expense.file && (
            <div className="flex items-center text-sm text-blue-600">
              <FileText className="h-4 w-4 mr-2" />
              <a 
                href={expense.file.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {expense.file.name}
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {expense.tags && expense.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {expense.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Badge récurrente */}
        {expense.is_recurring && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Clock className="h-3 w-3 mr-1" />
              Récurrente
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {/* Actions selon le statut */}
            {expense.status === 'pending' && onApprove && (
              <button
                onClick={handleApprove}
                className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approuver
              </button>
            )}
            
            {expense.status === 'approved' && onMarkAsPaid && (
              <button
                onClick={handleMarkAsPaid}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Marquer comme payée
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </button>
            
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
