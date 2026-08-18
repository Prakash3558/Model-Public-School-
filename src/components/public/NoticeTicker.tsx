import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../../lib/api';
import { Notice, NoticeBannerConfig } from '../../types';
import { useCMS } from '../../context/CMSContext';
import { useAuth } from '../../context/AuthContext';
import { useSupabaseRealtimeRefresh } from '../../hooks/useSupabaseRealtimeRefresh';
import { Bell, Edit3, Sparkles, ExternalLink, X, Check, Eye, Megaphone, Volume2, ShieldAlert } from 'lucide-react';

export const NoticeTicker: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();
  const { user, isEditMode } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Local state for modal editing
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

  const [editForm, setEditForm] = useState<NoticeBannerConfig>(bannerConfig);

  useEffect(() => {
    setEditForm(bannerConfig);
  }, [bannerConfig]);

  const fetchNotices = useCallback(() => {
    api.getNotices(true).then(data => {
      const urgent = (data || []).filter(n => n.isUrgentTicker);
      setNotices(prev => {
        if (JSON.stringify(prev) === JSON.stringify(urgent)) return prev;
        return urgent;
      });
    }).catch(() => {
      // silent fallback on network hiccup
    });
  }, []);

  // Global Realtime Refresh hook for live notices
  const { refreshCount } = useSupabaseRealtimeRefresh(
    ['public:notice_board', 'public:site_settings'],
    useCallback((event) => {
      console.log(`[NoticeTicker] Realtime update on ${event.topic} -> refreshing live notices`);
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

  // Save banner settings
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      notice_banner: editForm
    });
    setShowEditModal(false);
  };

  // If banner is disabled and not admin edit mode, don't show
  if (bannerConfig.enabled === false && !isEditMode && user?.role !== 'admin') {
    return null;
  }

  // Determine what items to show
  const hasUrgentNotices = notices.length > 0;
  const useUrgent = bannerConfig.useLiveNotices && hasUrgentNotices;

  // Badge color mapping
  const badgeColorClass = {
    blue: 'bg-blue-600 text-white',
    rose: 'bg-rose-600 text-white',
    amber: 'bg-amber-500 text-slate-950 font-black',
    emerald: 'bg-emerald-600 text-white',
    purple: 'bg-purple-600 text-white',
    indigo: 'bg-indigo-600 text-white'
  }[editForm.badgeColor || 'blue'] || 'bg-blue-600 text-white';

  const speedClass = {
    slow: '[animation-duration:45s]',
    normal: '[animation-duration:30s]',
    fast: '[animation-duration:18s]'
  }[bannerConfig.speed || 'normal'] || '[animation-duration:30s]';

  return (
    <>
      <div
        id="top-notice-banner"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative z-30 transition-all border-b text-xs py-2 px-3 sm:px-4 flex items-center shadow-xs select-none ${
          bannerConfig.enabled === false
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            : 'bg-slate-900 text-slate-100 dark:bg-slate-900 dark:text-slate-100 border-slate-800'
        }`}
      >
        {/* Badge Indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0 mr-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs ${badgeColorClass}`}>
            <Bell className="w-3 h-3 flex-shrink-0 animate-bounce" />
            <span>{bannerConfig.badgeText || 'Notice'}:</span>
          </div>
        </div>

        {/* Marquee Content */}
        <div className="overflow-hidden whitespace-nowrap flex-grow relative text-xs">
          {bannerConfig.enabled === false ? (
            <span className="italic text-slate-400 font-semibold">
              ⚠️ Top Notice Banner is currently disabled (visible only to Admins). Click "Edit Banner" to enable.
            </span>
          ) : bannerConfig.isMarquee !== false ? (
            <div
              className={`inline-block animate-marquee flex items-center gap-8 text-xs font-medium text-slate-200 ${speedClass} ${
                isHovered ? '[animation-play-state:paused]' : ''
              }`}
            >
              {useUrgent ? (
                notices.map((n, idx) => (
                  <span key={n.id || idx} className="inline-flex items-center gap-2">
                    <strong className="font-extrabold text-amber-400">{n.title}:</strong>
                    <span className="text-slate-200">{n.content}</span>
                    <span className="mx-3 text-slate-500">•</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span className="text-slate-100 font-medium">
                    {bannerConfig.customText || 'Welcome to Model Public School, Sikta - Admissions Open for Session 2026-27!'}
                  </span>
                  <span className="mx-3 text-slate-500">•</span>
                  <span className="text-slate-100 font-medium">
                    {bannerConfig.customText || 'Welcome to Model Public School, Sikta - Admissions Open for Session 2026-27!'}
                  </span>
                </span>
              )}
            </div>
          ) : (
            <div className="truncate text-xs font-medium text-slate-200 flex items-center gap-2">
              {useUrgent ? (
                <span>
                  <strong className="font-extrabold text-amber-400 mr-1.5">{notices[0]?.title}:</strong>
                  {notices[0]?.content}
                </span>
              ) : (
                <span>{bannerConfig.customText}</span>
              )}
            </div>
          )}
        </div>

        {/* Action Link Button if provided */}
        {bannerConfig.linkText && bannerConfig.linkUrl && bannerConfig.enabled !== false && (
          <a
            href={bannerConfig.linkUrl}
            className="hidden sm:inline-flex items-center gap-1 ml-3 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] tracking-wide transition-all shadow flex-shrink-0"
          >
            <span>{bannerConfig.linkText}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}

        {/* Admin Quick Edit Button */}
        {(isEditMode || user?.role === 'admin') && (
          <button
            onClick={() => setShowEditModal(true)}
            className="ml-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black tracking-wide shadow-md transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
            title="Edit Notice Banner"
          >
            <Edit3 className="w-2.5 h-2.5" />
            <span>Edit Banner</span>
          </button>
        )}
      </div>

      {/* ADMIN BANNER EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-heading">Edit Top Notice Banner</h3>
                  <p className="text-[11px] text-slate-400">Configure top beginning marquee announcement and live ticker</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-3.5 text-xs font-medium">
              {/* Enable / Disable toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div>
                  <label className="font-bold text-white block">Banner Display Status</label>
                  <span className="text-[11px] text-slate-400">Show or hide the top announcement ticker</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.enabled}
                    onChange={e => setEditForm({ ...editForm, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Badge Text & Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Badge Text</label>
                  <input
                    type="text"
                    value={editForm.badgeText}
                    onChange={e => setEditForm({ ...editForm, badgeText: e.target.value })}
                    placeholder="e.g. Notice, Urgent, Admissions"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Badge Color</label>
                  <select
                    value={editForm.badgeColor || 'blue'}
                    onChange={e => setEditForm({ ...editForm, badgeColor: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold"
                  >
                    <option value="blue">🔵 Royal Blue</option>
                    <option value="rose">🔴 Crimson Red / Urgent</option>
                    <option value="amber">🟡 Golden Amber</option>
                    <option value="emerald">🟢 Emerald Green</option>
                    <option value="purple">🟣 Royal Purple</option>
                    <option value="indigo">🟦 Indigo</option>
                  </select>
                </div>
              </div>

              {/* Data Source: Live Urgent Notices vs Custom Message */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">Content Source</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, useLiveNotices: true })}
                    className={`p-2.5 rounded-xl text-left border font-semibold transition-all ${
                      editForm.useLiveNotices
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-white text-xs">🔔 Urgent Notices List</div>
                    <div className="text-[10px] text-slate-400">Stream items from Notice Board marked as ticker</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditForm({ ...editForm, useLiveNotices: false })}
                    className={`p-2.5 rounded-xl text-left border font-semibold transition-all ${
                      !editForm.useLiveNotices
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="font-bold text-white text-xs">✏️ Custom Banner Text</div>
                    <div className="text-[10px] text-slate-400">Show single custom message set below</div>
                  </button>
                </div>
              </div>

              {/* Custom Announcement Message */}
              <div>
                <label className="block mb-1 text-slate-300 font-bold">
                  Announcement Message {editForm.useLiveNotices && '(Used as fallback if no urgent notices active)'}
                </label>
                <textarea
                  rows={2}
                  value={editForm.customText}
                  onChange={e => setEditForm({ ...editForm, customText: e.target.value })}
                  placeholder="e.g. Admissions Open for Session 2026-27 (Nursery to Class 10)..."
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs"
                />
              </div>

              {/* Action Button Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Action Button Text (Optional)</label>
                  <input
                    type="text"
                    value={editForm.linkText || ''}
                    onChange={e => setEditForm({ ...editForm, linkText: e.target.value })}
                    placeholder="e.g. Apply Now, View Details"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-300 font-bold">Button URL / Link</label>
                  <input
                    type="text"
                    value={editForm.linkUrl || ''}
                    onChange={e => setEditForm({ ...editForm, linkUrl: e.target.value })}
                    placeholder="e.g. #admissions, /portal, #fees"
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Marquee & Speed */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 bg-slate-800 rounded-xl border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isMarquee !== false}
                    onChange={e => setEditForm({ ...editForm, isMarquee: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-700"
                  />
                  <span className="text-slate-200 text-xs font-bold">Scroll Marquee Animation</span>
                </label>

                <div>
                  <select
                    value={editForm.speed || 'normal'}
                    onChange={e => setEditForm({ ...editForm, speed: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-semibold"
                  >
                    <option value="slow">🐢 Slow Scroll</option>
                    <option value="normal">⚡ Normal Speed</option>
                    <option value="fast">🚀 Fast Scroll</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Preview:</span>
                <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-xl text-xs text-white border border-slate-800">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColorClass}`}>
                    {editForm.badgeText || 'Notice'}:
                  </span>
                  <span className="truncate flex-1 text-slate-200">
                    {editForm.customText || 'Preview announcement text...'}
                  </span>
                  {editForm.linkText && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                      {editForm.linkText}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Banner Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

