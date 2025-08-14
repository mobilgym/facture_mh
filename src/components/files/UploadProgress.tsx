import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
}

export default function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center space-x-2">
        <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
        <span className="text-blue-600 font-medium">
          Téléchargement en cours...
        </span>
      </div>
      
      <div className="w-full max-w-xs mx-auto">
        <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <motion.div 
            className="bg-blue-600 h-2.5"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <motion.p 
          className="text-sm text-gray-500 mt-1 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {Math.round(progress)}%
        </motion.p>
      </div>
    </div>
  );
}