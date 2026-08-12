import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Camera, Upload, Link as LinkIcon, Save, X } from 'lucide-react';

interface EditableImageProps {
  src: string;
  alt: string;
  className?: string;
  onSaveImage: (newUrl: string) => void;
  aspectRatio?: string;
  isVideo?: boolean;
  loading?: 'lazy' | 'eager';
}

export const EditableImage: React.FC<EditableImageProps> = React.memo(({
  src,
  alt,
  className = '',
  onSaveImage,
  isVideo = false,
  loading = 'lazy'
}) => {
  const { isEditMode } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState(src);
  const [preview, setPreview] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isEditMode) {
    if (isVideo) {
      return <video src={src} className={className} autoPlay loop muted playsInline />;
    }
    const isEager = loading === 'eager';
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        {!isLoaded && !isEager && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={isEager ? 'sync' : 'async'}
          {...(isEager ? { fetchPriority: 'high' as const } : {})}
          onLoad={() => setIsLoaded(true)}
          className={`${className} ${isEager ? 'opacity-100' : `transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}`}
        />
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            const resultStr = reader.result.toString();
            setPreview(resultStr);
            setUrlInput(resultStr);
            api.uploadFile(resultStr, file.name).then(res => {
              if (res.url) {
                setPreview(res.url);
                setUrlInput(res.url);
              }
            });
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = (event: any) => {
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          let dataUrl = event.target.result;
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          }
          setPreview(dataUrl);
          setUrlInput(dataUrl);
          api.uploadFile(dataUrl, file.name).then(res => {
            if (res.url) {
              setPreview(res.url);
              setUrlInput(res.url);
            }
          });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = async () => {
    let finalUrl = preview || urlInput;
    if (finalUrl.startsWith('data:')) {
      try {
        const res = await api.uploadFile(finalUrl);
        if (res.url) finalUrl = res.url;
      } catch (e) {
        console.warn('Upload error:', e);
      }
    }
    onSaveImage(finalUrl);
    setModalOpen(false);
  };

  return (
    <div className="relative group inline-block w-full h-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      {!isLoaded && !isVideo && loading !== 'eager' && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      {isVideo ? (
        <video src={src} className={className} autoPlay loop muted playsInline />
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={loading === 'eager' ? 'sync' : 'async'}
          {...(loading === 'eager' ? { fetchPriority: 'high' as const } : {})}
          onLoad={() => setIsLoaded(true)}
          className={`${className} ${loading === 'eager' ? 'opacity-100' : `transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}`}
        />
      )}

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded cursor-pointer z-10">
        <button
          onClick={() => {
            setPreview(src);
            setUrlInput(src);
            setModalOpen(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs px-3 py-2 rounded-lg shadow-xl flex items-center gap-1.5 transform hover:scale-105 transition-transform"
        >
          <Camera className="w-4 h-4" />
          Swap Media
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                Change Media Resource
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Upload From Phone / PC Gallery
                </label>
                <label className="border-2 border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-amber-50/50 dark:bg-amber-950/20 transition-colors">
                  <Upload className="w-8 h-8 text-amber-500 mb-1" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Click or Drag Photo / Video Here
                  </span>
                  <span className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP, MP4</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-xs font-bold uppercase">OR PASTE URL</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5" /> Direct Image / Video Link
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => {
                    setUrlInput(e.target.value);
                    setPreview(e.target.value);
                  }}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {preview && (
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500 mb-1">Preview</span>
                  <div className="h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    {preview.startsWith('data:video') || preview.endsWith('.mp4') ? (
                      <video src={preview} className="max-h-full max-w-full object-contain" controls />
                    ) : (
                      <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" /> Save Replacement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
