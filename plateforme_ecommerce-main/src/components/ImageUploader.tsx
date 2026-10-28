/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (base64: string) => void;
  label: string;
  id?: string;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  maxSizeMB?: number;
}

export default function ImageUploader({
  value,
  onChange,
  label,
  id,
  showToast,
  maxSizeMB = 4
}: ImageUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // 1. Validation de type
    if (!file.type.startsWith('image/')) {
      showToast('Seuls les fichiers de type image sont acceptés.', 'error');
      return;
    }

    // 2. Validation de taille (maxSizeMB)
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      showToast(`Cette image est trop volumineuse (${sizeInMB.toFixed(1)} Mo). Maximum autorisé : ${maxSizeMB} Mo.`, 'error');
      return;
    }

    // 3. Lecture du fichier en Base64
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
        showToast('Photo importée localement avec succès !', 'success');
      } else {
        showToast('Impossible de lire le fichier.', 'error');
      }
    };
    reader.onerror = () => {
      showToast('Erreur lors de la lecture du fichier.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Photo supprimée de la sélection.', 'info');
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-1.5" id={id}>
      <label className="text-slate-400 uppercase tracking-wider font-mono font-bold text-[10px] block">
        {label}
      </label>

      {value ? (
        // Preview State
        <div className="relative group rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center">
          <img
            src={value || undefined}
            alt="Uploaded Preview"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={triggerInputClick}
              className="p-2.5 bg-white text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-100 shadow-md transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-4 h-4" />
              Remplacer
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 shadow-md transition-transform hover:scale-105 cursor-pointer flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Retirer
            </button>
          </div>
          {/* Active status indicator */}
          <div className="absolute bottom-2 left-2 bg-emerald-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1 uppercase tracking-wide">
            <CheckCircle className="w-3 h-3" />
            Photo Locale Importée
          </div>
        </div>
      ) : (
        // Dropzone State
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerInputClick}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 aspect-video ${
            isDragActive
              ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className={`p-3 rounded-xl transition-all ${isDragActive ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400 border border-slate-100 shadow-xs'}`}>
            <Upload className="w-5 h-5 animate-bounce" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700">
              Glissez-déposez votre photo ici
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              Ou <span className="text-emerald-600 font-bold hover:underline">parcourez vos fichiers</span> (JPEG, PNG, WEBP max {maxSizeMB}Mo)
            </p>
          </div>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
