"use client";

import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  success?: boolean;
}

export default function InfoModal({ isOpen, title = 'Notice', message, onClose, success = true }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-gradient-to-br from-purple-950/95 to-purple-900/95 backdrop-blur-sm rounded-xl border-4 border-sky-200/70 shadow-2xl shadow-sky-200/20 w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-sky-200/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-amber-400">{title}</h3>
            <button onClick={onClose} className="text-purple-300 hover:text-white transition-colors text-xl">✕</button>
          </div>
        </div>
        <div className="p-5">
          <div className={`mb-3 text-sm ${success ? 'text-green-300' : 'text-red-300'}`}>
            {success ? 'Success' : 'Error'}
          </div>
          {message && <p className="text-purple-200 text-sm leading-6 whitespace-pre-line">{message}</p>}
        </div>
        <div className="p-5 border-t border-sky-200/20 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


