import React, { useState, useMemo } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableImage } from '../common/EditableImage';
import { Image as ImageIcon, X, Plus, ExternalLink, Filter, Sparkles, Eye } from 'lucide-react';

export const GallerySection: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();
  const gallery = settings?.gallery || [];
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const categories = ['All', 'Campus', 'Academics', 'Events', 'Sports'];

  const filtered = useMemo(() => {
    return activeCategory === 'All'
      ? gallery
      : gallery.filter(g => g.category.toLowerCase() === activeCategory.toLowerCase());
  }, [activeCategory, gallery]);

  // Show top 4 curated items on homepage preview
  const previewItems = gallery.slice(0, 4);

  const handleUpdateGalleryImage = (id: string, newUrl: string) => {
    if (!settings) return;
    const updated = settings.gallery.map(g => g.id === id ? { ...g, url: newUrl } : g);
    updateSettings({ gallery: updated });
  };

  const handleAddGalleryPhoto = () => {
    if (!settings) return;
    const newItem = {
      id: 'g-' + Date.now(),
      title: 'New Campus Photograph',
      category: activeCategory === 'All' ? 'Campus' : activeCategory,
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
      caption: 'Model Public School Sikta activities'
    };
    updateSettings({ gallery: [newItem, ...settings.gallery] });
  };

  return (
    <section id="gallery" className="py-20 bg-slate-50 dark:bg-slate-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
            Campus Life & Moments
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-heading">
            <EditableText blockKey="gallery.heading" defaultText="Photo & Media Gallery" />
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A glance into our state-of-the-art facilities, academic activities, cultural festivals, and athletic achievements at Sikta.
          </p>
        </div>

        {/* Curated 4-Card Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {previewItems.map(item => (
            <div
              key={item.id}
              onClick={() => {
                setLightboxOpen(true);
                setSelectedPhoto(item.url);
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <EditableImage
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onSaveImage={(url) => handleUpdateGalleryImage(item.id, url)}
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold">View Photo</span>
                </div>
                <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/30">
                  {item.category}
                </span>
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm font-heading line-clamp-1">
                    <EditableText blockKey={`gallery.${item.id}.title`} defaultText={item.title} />
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-body">
                    <EditableText blockKey={`gallery.${item.id}.caption`} defaultText={item.caption} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button to Open Full Lightbox Gallery */}
        <div className="mt-10 text-center">
          <button
            onClick={() => setLightboxOpen(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-extrabold text-xs sm:text-sm px-8 py-3.5 rounded-2xl shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <ImageIcon className="w-4 h-4 text-amber-400 dark:text-slate-950" />
            <span>View All Media & Gallery ({gallery.length} Photos)</span>
            <ExternalLink className="w-4 h-4 opacity-75" />
          </button>
        </div>
      </div>

      {/* FULL-SCREEN LIGHTBOX GALLERY MODAL */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          {/* Modal Top Bar */}
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-black text-lg font-heading">Model Public School Media Gallery</h3>
                <p className="text-xs text-slate-400">Campus activities, laboratories, sports meets & events</p>
              </div>
            </div>

            <button
              onClick={() => {
                setLightboxOpen(false);
                setSelectedPhoto(null);
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
              title="Close Gallery"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Middle Content */}
          <div className="max-w-7xl w-full mx-auto my-auto py-4 overflow-y-auto max-h-[78vh] pr-1 space-y-6">
            {/* Category Filter Pills */}
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter className="w-4 h-4 text-slate-400" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {settings && (
                <button
                  onClick={handleAddGalleryPhoto}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> Add Photo
                </button>
              )}
            </div>

            {/* Grid of All Photos in Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedPhoto(item.url)}
                  className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-amber-500/50 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <EditableImage
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onSaveImage={(url) => handleUpdateGalleryImage(item.id, url)}
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                      <Eye className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h5 className="font-bold text-white text-xs font-heading">{item.title}</h5>
                    <p className="text-[11px] text-slate-400">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="max-w-7xl w-full mx-auto pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
            <span>Showing {filtered.length} photos</span>
            <span className="text-amber-400 font-bold">Model Public School Sikta</span>
          </div>

          {/* Photo Zoom Overlay */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-60 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3">
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute -top-12 right-0 text-white hover:text-amber-400 p-2"
                >
                  <X className="w-8 h-8" />
                </button>
                <img
                  src={selectedPhoto}
                  alt="Enlarged view"
                  loading="lazy"
                  decoding="async"
                  className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});
