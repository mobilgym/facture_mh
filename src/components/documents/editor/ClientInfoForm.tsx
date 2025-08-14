import React from 'react';

interface ClientInfoFormProps {
  clientInfo: {
    name: string;
    address: string;
    email: string;
  };
  onChange: (info: { name: string; address: string; email: string }) => void;
}

export default function ClientInfoForm({ clientInfo, onChange }: ClientInfoFormProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Informations client</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input
            type="text"
            value={clientInfo.name}
            onChange={(e) => onChange({ ...clientInfo, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={clientInfo.email}
            onChange={(e) => onChange({ ...clientInfo, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Adresse</label>
          <textarea
            value={clientInfo.address}
            onChange={(e) => onChange({ ...clientInfo, address: e.target.value })}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}