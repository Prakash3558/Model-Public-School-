import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Notice } from '../../types';
import { Bell } from 'lucide-react';

export const NoticeTicker: React.FC = React.memo(() => {
  const [notices, setNotices] = useState<Notice[]>([]);

  const fetchNotices = () => {
    api.getNotices().then(data => {
      const urgent = (data || []).filter(n => n.isUrgentTicker);
      setNotices(prev => {
        if (JSON.stringify(prev) === JSON.stringify(urgent)) return prev;
        return urgent;
      });
    }).catch(() => {
      // silent fallback on network hiccup
    });
  };

  useEffect(() => {
    fetchNotices();

    const interval = setInterval(fetchNotices, 3000);
    const handleUpdate = () => {
      setTimeout(() => fetchNotices(), 0);
    };

    window.addEventListener('mps_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mps_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (notices.length === 0) return null;

  return (
    <div className="bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 font-medium text-xs py-2 px-4 flex items-center relative z-30 border-b border-slate-200 dark:border-slate-700 shadow-xs">
      <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 mr-3 shadow-xs">
        <Bell className="w-3 h-3 text-white" />
        <span>Notice:</span>
      </div>

      <div className="overflow-hidden whitespace-nowrap flex-grow relative">
        <div className="inline-block animate-marquee flex items-center gap-8 text-xs text-slate-700 dark:text-slate-200">
          {notices.map((n, idx) => (
            <span key={n.id || idx} className="inline-flex items-center gap-2">
              <strong className="font-bold text-slate-900 dark:text-white">{n.title}:</strong>
              <span className="text-slate-600 dark:text-slate-300">{n.content}</span>
              <span className="mx-3 text-slate-400">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});
