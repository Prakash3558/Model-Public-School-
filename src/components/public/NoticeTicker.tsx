import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { Notice, NoticeBannerConfig } from '../../types';
import { useCMS } from '../../context/CMSContext';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import { Bell, Sparkles, ExternalLink } from 'lucide-react';

export const NoticeTicker: React.FC = React.memo(() => {
  const { settings } = useCMS();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const bannerConfig: NoticeBannerConfig = useMemo(() => {
    return settings?.notice_banner || {
      enabled: true,
      badgeText: 'Notice',
      badgeColor: 'blue',
      customText: 'Admissions Open for Session 2026-27 (Nursery to Class 10). Online Registration & Entrance Forms Available!',
      useLiveNotices: true,
      linkText: 'Apply Now',
      linkUrl: '#admissions',
      speed: 'normal',
      isMarquee: true
    };
  }, [settings?.notice_banner]);

  const fetchNotices = useCallback(() => {
    api.getNotices(true).then(data => {
      const urgent = (data || []).filter(n => n.isUrgentTicker);
      setNotices(prev => {
        if (JSON.stringify(prev) === JSON.stringify(urgent)) return prev;
        return urgent;
      });
    }).catch(() => {
      // silent fallback
    });
  }, []);

  // Global Realtime Refresh hook for live notices
  const { refreshCount } = useSupabaseRealtimeRefresh(
    ['public:notice_board', 'public:site_settings'],
    useCallback((event) => {
      fetchNotices();
    }, [fetchNotices])
  );

  useEffect(() => {
    fetchNotices();

    const interval = setInterval(fetchNotices, 8000);
    const handleUpdate = () => {
      setTimeout(() => fetchNotices(), 0);
    };

    window.addEventListener('mps_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('mps_realtime_notice_board', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mps_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('mps_realtime_notice_board', handleUpdate);
    };
  }, [fetchNotices, refreshCount]);

  if (bannerConfig.enabled === false) {
    return null;
  }

  const hasUrgentNotices = notices.length > 0;
  const useUrgent = bannerConfig.useLiveNotices && hasUrgentNotices;

  const badgeColorClass = {
    blue: 'bg-blue-600 text-white',
    rose: 'bg-rose-600 text-white',
    amber: 'bg-amber-500 text-slate-950 font-black',
    emerald: 'bg-emerald-600 text-white',
    purple: 'bg-purple-600 text-white'
  }[bannerConfig.badgeColor || 'blue'] || 'bg-blue-600 text-white';

  const speedClass = {
    slow: 'duration-[45s]',
    normal: 'duration-[25s]',
    fast: 'duration-[12s]'
  }[bannerConfig.speed || 'normal'] || 'duration-[25s]';

  return (
    <div
      className="bg-slate-950 text-white py-2 px-4 border-b border-slate-800 flex items-center justify-between text-xs overflow-hidden relative select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 flex-shrink-0 z-10 bg-slate-950 pr-3">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase shadow-xs flex items-center gap-1 ${badgeColorClass}`}>
          <Bell className="w-2.5 h-2.5" />
          <span>{bannerConfig.badgeText || (useUrgent ? 'Urgent Alert' : 'Notice')}</span>
        </span>
      </div>

      {/* Marquee Content Container */}
      <div className="flex-1 overflow-hidden relative mx-2">
        <div
          className={`whitespace-nowrap flex items-center gap-8 ${
            bannerConfig.isMarquee !== false
              ? `animate-marquee ${speedClass} ${isHovered ? '[animation-play-state:paused]' : ''}`
              : ''
          }`}
        >
          {useUrgent ? (
            notices.map((notice, idx) => (
              <span key={`notice-${notice.id}-${idx}`} className="inline-flex items-center gap-2">
                <span className="font-semibold text-amber-300">{notice.title}:</span>
                <span className="text-slate-300">{notice.content}</span>
                {idx < notices.length - 1 && (
                  <span className="text-amber-500 font-bold mx-2">•</span>
                )}
              </span>
            ))
          ) : (
            <span className="inline-flex items-center gap-2">
              <span className="font-medium text-slate-200">
                {bannerConfig.customText || 'Admissions Open for Session 2026-27 (Nursery to Class 10). Online Registration & Entrance Forms Available!'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Action Link Button if provided */}
      {bannerConfig.linkText && bannerConfig.linkUrl && (
        <a
          href={bannerConfig.linkUrl}
          className="hidden sm:inline-flex items-center gap-1 ml-3 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] tracking-wide transition-all shadow-xs flex-shrink-0"
        >
          <span>{bannerConfig.linkText}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
});
