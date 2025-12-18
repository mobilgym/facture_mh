import React, { useState } from 'react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import DocumentCategories from '@/components/documents/DocumentCategories';

export default function Documents() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 app-page budget-container">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-20">
              <DocumentCategories
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <div className="space-y-4 sm:space-y-6">
              <div className="glass-panel-strong rounded-xl">
                <div className="p-4 sm:p-5 border-b border-cyan-100/70">
                  <h1 className="text-fit-xl font-semibold text-gray-900 tracking-tight">
                    Documents administratifs
                  </h1>
                </div>
                <div className="p-4 sm:p-5">
                  <DocumentUploader
                    categoryId={selectedCategory}
                    onSuccess={() => {}}
                  />
                </div>
              </div>

              <DocumentList categoryId={selectedCategory} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
