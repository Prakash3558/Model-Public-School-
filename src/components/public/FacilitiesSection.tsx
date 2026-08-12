import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableImage } from '../common/EditableImage';
import { Card3DTilt } from '../common/Card3DTilt';
import { Facility } from '../../types';
import {
  Monitor, FlaskConical, Cpu, Bus, BookOpen, Trophy, ShieldCheck, Wifi, Music, Activity, HeartPulse, Sparkles, X, CheckCircle2, ChevronRight
} from 'lucide-react';

export const FacilitiesSection: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();
  const facilities = settings?.facilities || [];
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Monitor': return <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'FlaskConical': return <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Cpu': return <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Bus': return <Bus className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5 text-rose-500" />;
      case 'Wifi': return <Wifi className="w-5 h-5 text-cyan-500" />;
      case 'Music': return <Music className="w-5 h-5 text-purple-500" />;
      case 'Activity': return <Activity className="w-5 h-5 text-lime-500" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-red-500" />;
      default: return <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const handleUpdateFacilityImage = (id: string, newUrl: string) => {
    if (!settings) return;
    const updated = settings.facilities.map(f => f.id === id ? { ...f, image: newUrl } : f);
    updateSettings({ facilities: updated });
  };

  return (
    <section id="facilities" className="py-20 bg-white dark:bg-slate-950 transition-colors relative">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="text-center max-w-3xl mx-auto mb-14 space-y-3"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            World-Class Infrastructure
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-heading">
            <EditableText blockKey="facilities.heading" defaultText="Modern Campus & Learning Facilities" />
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Designed to foster intellectual curiosity, physical development, and digital proficiency across all age groups.
          </p>
        </div>

        {/* Uniform 3-Column Grid with 3D Tilt Cards & Scroll Reveal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facilities.map((f, idx) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full"
            >
              <Card3DTilt maxTilt={8} scaleOnHover={1.02} className="h-full">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col h-full group relative">
                  
                  {/* Category & Status Badges */}
                  <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
                    {f.category && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950/80 text-amber-400 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30">
                        {f.category}
                      </span>
                    )}
                    {f.status === 'Featured' && (
                      <span className="text-[10px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <div className="aspect-video overflow-hidden relative">
                    <EditableImage
                      src={f.image}
                      alt={f.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onSaveImage={(url) => handleUpdateFacilityImage(f.id, url)}
                    />
                  </div>

                  <div className="p-6 flex-grow space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700 flex-shrink-0">
                          {getIcon(f.iconName)}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                          <EditableText blockKey={`facility.${f.id}.title`} defaultText={f.title} />
                        </h3>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-body flex-grow line-clamp-3">
                        <EditableText blockKey={`facility.${f.id}.desc`} defaultText={f.description} multiline />
                      </p>

                      {/* Highlights Pills */}
                      {f.highlights && f.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {f.highlights.slice(0, 3).map((hl, hIdx) => (
                            <span key={hIdx} className="text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                              ✓ {hl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFacility(f)}
                      className="w-full py-2.5 mt-2 bg-slate-200/60 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-800 dark:text-slate-200 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Explore Facility Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card3DTilt>
            </motion.div>
          ))}
        </div>

        {/* Facility Details Modal */}
        <AnimatePresence>
          {selectedFacility && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] relative"
              >
                <button
                  onClick={() => setSelectedFacility(null)}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    {getIcon(selectedFacility.iconName)}
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-amber-500 tracking-wider">
                      {selectedFacility.category || 'Campus Facility'}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-heading">
                      {selectedFacility.title}
                    </h3>
                  </div>
                </div>

                <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                  <img src={selectedFacility.image} alt={selectedFacility.title} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Overview & Equipment Specifications</h4>
                  <p>{selectedFacility.overview || selectedFacility.description}</p>
                </div>

                {selectedFacility.highlights && selectedFacility.highlights.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Key Highlights</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {selectedFacility.highlights.map((hl, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});
