import React, { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { EditableImage } from '../common/EditableImage';
import { ChevronLeft, ChevronRight, Bookmark, Download, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { ThreeDHeroCanvas } from '../common/ThreeDHeroCanvas';
import { AppDownloadModal } from '../common/AppDownloadModal';

export const HeroSection: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();
  const slides = settings?.hero_slides || [];
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // If a custom video URL is provided in admin settings, use video mode; otherwise smooth slide images
  const hasCustomVideo = Boolean(settings?.hero_video_url && settings.hero_video_url.trim() !== '');
  const bgVideoUrl = settings?.hero_video_url;

  // Smooth automatic slide transition for image background
  useEffect(() => {
    if (hasCustomVideo || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasCustomVideo, slides.length]);

  const safeIndex = currentSlideIndex < slides.length ? currentSlideIndex : 0;

  const currentSlide = slides[safeIndex] || {
    title: 'Model Public School',
    subtitle: 'Nurturing excellence in academics & character since 2000',
    badge: `CBSE Affiliated · ${settings?.cbse_affiliation || '330854'}`,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600'
  };

  const handleUpdateSlideImage = (newUrl: string, slideIndex: number) => {
    if (!settings || !settings.hero_slides) return;
    const updatedSlides = [...settings.hero_slides];
    if (updatedSlides[slideIndex]) {
      updatedSlides[slideIndex].image = newUrl;
      updateSettings({ hero_slides: updatedSlides });
    }
  };

  const nextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative text-white overflow-hidden min-h-[620px] sm:min-h-[680px] lg:min-h-[720px] flex flex-col justify-between items-center bg-slate-950">
      {/* BACKGROUND MEDIA: SEAMLESS IMAGE-TO-IMAGE FADE (NO BLACK/WHITE GAP) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
        {hasCustomVideo ? (
          <div className="relative w-full h-full">
            <video
              autoPlay
              loop
              muted
              playsInline
              key={bgVideoUrl}
              className="w-full h-full object-cover scale-105 opacity-80 filter brightness-95 transition-all duration-1000"
            >
              <source src={bgVideoUrl} type="video/mp4" />
            </video>
          </div>
        ) : (
          /* Stacked Absolute Image Layers for Seamless Image-to-Image Fade */
          <div className="relative w-full h-full">
            {slides.map((slide, idx) => {
              const isActive = idx === currentSlideIndex;
              const isFirstSlide = idx === 0;
              return (
                <div
                  key={slide.id || idx}
                  className={`absolute inset-0 ${isFirstSlide && currentSlideIndex === 0 ? '' : 'transition-opacity duration-1000 ease-in-out'} ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <motion.div
                    animate={isActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut'
                    }}
                    className="w-full h-full"
                  >
                    <EditableImage
                      src={slide.image}
                      alt={`MPS Sikta Banner ${idx + 1}`}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover filter brightness-90 contrast-105"
                      onSaveImage={(newUrl) => handleUpdateSlideImage(newUrl, idx)}
                    />
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        {/* Soft Contrast Scrim Overlay */}
        <div className="absolute inset-0 z-15 bg-slate-950/40 pointer-events-none"></div>
        <div className="absolute inset-0 z-15 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/50 pointer-events-none"></div>
        
        {/* Interactive 3D WebGL Floating Geometry & Stars Overlay */}
        <ThreeDHeroCanvas />
      </div>

      {/* FLOATING SIDE NAVIGATION ARROWS (as seen in screenshot) */}
      {!hasCustomVideo && slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white backdrop-blur-md flex items-center justify-center border border-white/30 transition-all shadow-xl"
            title="Previous Slide"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white backdrop-blur-md flex items-center justify-center border border-white/30 transition-all shadow-xl"
            title="Next Slide"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>
        </>
      )}

      {/* CENTERED HERO CONTENT CONTAINER */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 pt-10 sm:pt-14 pb-8 flex-grow flex flex-col justify-center items-center text-center w-full space-y-6 sm:space-y-8">
        
        {/* Top Translucent Badge Pill (Matches screenshot) */}
        <div
          key={`badge-${currentSlideIndex}`}
          className="inline-flex items-center gap-2 bg-slate-900/60 border border-white/25 text-white font-medium text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md"
        >
          <Bookmark className="w-4 h-4 text-white" />
          <EditableText
            blockKey={`hero.slide.${currentSlideIndex}.badge`}
            defaultText={currentSlide.badge || `CBSE Affiliated · ${settings?.cbse_affiliation || '330854'}`}
          />
        </div>

        {/* Main Display Headline in Serif Typography (Exact screenshot style) */}
        <div className="space-y-3 max-w-3xl">
          <h1
            key={`title-${currentSlideIndex}`}
            className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-white leading-[1.1] drop-shadow-2xl"
          >
            <EditableText
              blockKey={`hero.slide.${currentSlideIndex}.title`}
              defaultText={currentSlide.title || 'Model Public School'}
              multiline
            />
          </h1>

          {/* Subtitle */}
          <div
            key={`sub-${currentSlideIndex}`}
            className="text-base sm:text-xl text-white/95 leading-relaxed font-sans max-w-xl mx-auto font-normal drop-shadow-lg"
          >
            <EditableText
              blockKey={`hero.slide.${currentSlideIndex}.subtitle`}
              defaultText={currentSlide.subtitle || 'Nurturing excellence in academics & character since 2000'}
              multiline
            />
          </div>
        </div>

        {/* Vertical Centered Pill Buttons Stack (Exact color match & refined typography) */}
        <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-xs pt-1">
          {/* Top Golden/Amber Pill Button */}
          <a
            href="#admissions"
            className="w-full bg-[#f39c12] hover:bg-[#e67e22] text-white font-extrabold text-sm sm:text-base py-3 px-8 rounded-full shadow-lg text-center transition-all transform hover:scale-[1.02] active:scale-100 hover:shadow-amber-500/25"
          >
            Apply for Admission
          </a>

          {/* Student App Download Action Button */}
          <button
            type="button"
            onClick={() => setDownloadModalOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base py-3 px-6 rounded-full shadow-lg text-center transition-all transform hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2 border border-blue-400/30 hover:shadow-blue-500/25"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Download School App</span>
          </button>

          {/* Middle Deep Emerald Green Pill Button */}
          <a
            href="/portal"
            className="w-full bg-[#0d5c3a] hover:bg-[#09472d] text-white font-bold text-sm sm:text-base py-2.5 px-8 rounded-full shadow-md text-center transition-all transform hover:scale-[1.02] active:scale-100 hover:shadow-emerald-900/30"
          >
            Student Login
          </a>

          {/* Bottom Glass Outline Pill Button */}
          <a
            href="#facilities"
            className="w-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold text-xs sm:text-sm py-2 px-8 rounded-full shadow-xs backdrop-blur-md text-center transition-all transform hover:scale-[1.02] active:scale-100"
          >
            Explore Campus
          </a>
        </div>

        {/* Quick Highlights Floating Badge Strip */}
        <div className="pt-2 hidden md:flex items-center justify-center gap-6 text-xs text-white/80 font-medium">
          <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> 25+ Years Legacy
          </span>
          <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 100% CBSE Pass Rate
          </span>
          <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/10 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Smart Classes & AI Labs
          </span>
        </div>
      </div>

      {/* App Download Modal */}
      <AppDownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
      />

      {/* BOTTOM SLIDE DOTS / INDICATOR (Matches screenshot bottom indicators) */}
      {!hasCustomVideo && slides.length > 1 && (
        <div className="relative z-20 pb-6 flex items-center justify-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                idx === currentSlideIndex
                  ? 'bg-white w-10 shadow-lg'
                  : 'bg-white/40 w-2.5 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
});
