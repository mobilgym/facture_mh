import React, { useState } from 'react';
import DocumentUploader from '@/components/documents/DocumentUploader';
import DocumentList from '@/components/documents/DocumentList';
import DocumentCategories from '@/components/documents/DocumentCategories';

export default function Documents() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <DocumentCategories
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Documents administratifs
                  </h1>
                </div>
                <div className="p-4">
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