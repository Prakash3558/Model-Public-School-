import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Camera, Upload, Link as LinkIcon, Save, X, Loader2, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';

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
  const [urlInput, setUrlInput] = useState(src || '');
  const [preview, setPreview] = useState(src || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state if external src prop changes (e.g., from real-time sync from another device)
  useEffect(() => {
    setUrlInput(src || '');
    setPreview(src || '');
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoaded(true);
    setHasError(true);
  };

  if (!isEditMode) {
    if (isVideo) {
      return <video src={src} className={className} autoPlay loop muted playsInline />;
    }
    const isEager = loading === 'eager';
    return (
      <div className="relative w-full h-full overflow-hidden bg-slate-200/60 dark:bg-slate-800/60">
        {!isLoaded && !isEager && (
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
        {hasError ? (
          <div className={`w-full h-full min-h-[120px] flex flex-col items-center justify-center p-4 text-center bg-slate-100 dark:bg-slate-800 text-slate-400 ${className}`}>
            <ImageIcon className="w-8 h-8 mb-1 text-slate-400 opacity-60" />
            <span className="text-xs font-medium">{alt || 'Image unavailable'}</span>
          </div>
        ) : (
          <img
            src={src}
            alt={alt}
            loading={loading}
            decoding={isEager ? 'sync' : 'async'}
            referrerPolicy="no-referrer"
            {...(isEager ? { fetchPriority: 'high' as const } : {})}
            onLoad={handleImageLoad}
            onError={handleImageError}
            className={`${className} transition-opacity duration-300 ${isLoaded || isEager ? 'opacity-100' : 'opacity-80'}`}
          />
        )}
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setErrorMessage('');

    try {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (reader.result) {
            const resultStr = reader.result.toString();
            setPreview(resultStr);
            setUrlInput(resultStr);
            try {
              const res = await api.uploadFile(resultStr, file.name);
              if (res.url) {
                setPreview(res.url);
                setUrlInput(res.url);
                setUploadSuccess(true);
              }
            } catch (err: any) {
              setErrorMessage('Upload fallback to local URL');
            } finally {
              setIsUploading(false);
            }
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      // High-speed client-side image compression before cloud upload
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = (event: any) => {
        img.src = event.target.result;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1400;
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
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
          // Set instant local thumbnail preview
          setPreview(dataUrl);
          setUrlInput(dataUrl);

          // Upload to Supabase Cloud Storage for worldwide instant availability
          try {
            const res = await api.uploadFile(dataUrl, file.name);
            if (res.url) {
              setPreview(res.url);
              setUrlInput(res.url);
              setUploadSuccess(true);
            }
          } catch (err: any) {
            console.warn('Storage upload notice:', err);
          } finally {
            setIsUploading(false);
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to process file');
      setIsUploading(false);
    }
  };

  const handleApply = async () => {
    let finalUrl = preview || urlInput;
    if (!finalUrl) {
      setErrorMessage('Please provide an image URL or upload a file.');
      return;
    }

    if (finalUrl.startsWith('data:')) {
      setIsUploading(true);
      try {
        const res = await api.uploadFile(finalUrl, 'image.jpg');
        if (res.url) finalUrl = res.url;
      } catch (e) {
        console.warn('Upload error on apply:', e);
      } finally {
        setIsUploading(false);
      }
    }

    onSaveImage(finalUrl);
    setModalOpen(false);
    setHasError(false);
    setIsLoaded(false);
  };

  return (
    <div className="relative group inline-block w-full h-full bg-slate-200/60 dark:bg-slate-800/60 overflow-hidden">
      {!isLoaded && !isVideo && loading !== 'eager' && (
        <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      )}
      {isVideo ? (
        <video src={src} className={className} autoPlay loop muted playsInline />
      ) : hasError ? (
        <div className={`w-full h-full min-h-[120px] flex flex-col items-center justify-center p-4 text-center bg-slate-100 dark:bg-slate-800 text-slate-400 ${className}`}>
          <ImageIcon className="w-8 h-8 mb-1 text-slate-400 opacity-60" />
          <span className="text-xs font-medium">{alt || 'Image placeholder'}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={loading === 'eager' ? 'sync' : 'async'}
          referrerPolicy="no-referrer"
          {...(loading === 'eager' ? { fetchPriority: 'high' as const } : {})}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-300 ${isLoaded || loading === 'eager' ? 'opacity-100' : 'opacity-80'}`}
        />
      )}

      {/* Floating Hover/Tap Edit Button */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded cursor-pointer z-10">
        <button
          onClick={() => {
            setPreview(src);
            setUrlInput(src);
            setUploadSuccess(false);
            setErrorMessage('');
            setModalOpen(true);
          }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-1.5 transform hover:scale-105 transition-transform"
        >
          <Camera className="w-4 h-4" />
          Change Image / Media
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200 text-slate-800 dark:text-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading">Change Image Resource</h3>
                  <p className="text-[11px] text-slate-400">Updates live globally across all devices</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  1. Upload from Phone / PC Gallery
                </label>
                <label className={`border-2 border-dashed ${isUploading ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30' : 'border-amber-300 dark:border-amber-700/60 hover:border-amber-500'} rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-amber-50/40 dark:bg-amber-950/10 transition-colors`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center py-2 space-y-2">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Uploading to Supabase Cloud Storage...
                      </span>
                    </div>
                  ) : uploadSuccess ? (
                    <div className="flex flex-col items-center py-1 space-y-1 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-7 h-7" />
                      <span className="text-xs font-bold">Uploaded & Synced with Cloud!</span>
                      <span className="text-[10px] text-slate-400">Click below or upload another</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-amber-500 mb-1" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        Tap or Drag Photo Here
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP, MP4</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">OR DIRECT WEB LINK</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-amber-500" /> Image / Video URL
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => {
                    setUrlInput(e.target.value);
                    setPreview(e.target.value);
                    setUploadSuccess(false);
                  }}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              {/* Live Preview */}
              {preview && (
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Live Preview
                  </span>
                  <div className="h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center p-2 relative">
                    {preview.startsWith('data:video') || preview.endsWith('.mp4') ? (
                      <video src={preview} className="max-h-full max-w-full object-contain rounded-lg" controls />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                        onError={() => setErrorMessage('Warning: Preview URL could not be rendered')}
                      />
                    )}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-1.5 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800/50">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isUploading}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:opacity-50 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> Apply & Save Globally
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
