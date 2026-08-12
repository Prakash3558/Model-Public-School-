import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SiteSettings } from '../types';
import { api } from '../lib/api';

interface CMSContextType {
  settings: SiteSettings | null;
  loading: boolean;
  syncStatus: 'synced' | 'saving' | 'saved' | 'error';
  lastSavedAt: number | null;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  updateContentBlock: (key: string, value: string) => Promise<void>;
  getContentBlock: (key: string, fallback: string) => string;
  refreshSettings: () => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'mps_site_settings_v3';

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read settings from localStorage:', e);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      return true;
    }
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'saved' | 'error'>('synced');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // Timestamp of the user's last local edit to prevent background polling from wiping out active changes
  const lastLocalEditTimeRef = useRef<number>(0);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveToLocalStorage = (data: SiteSettings) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  };

  const applyThemeAndFonts = useCallback((data: SiteSettings) => {
    if (!data) return;
    const root = document.documentElement;
    if (data.theme_colors) {
      root.style.setProperty('--color-primary', data.theme_colors.primary || '#1e3a8a');
      root.style.setProperty('--color-secondary', data.theme_colors.secondary || '#d97706');
      root.style.setProperty('--color-accent', data.theme_colors.accent || '#0d9488');
      root.style.setProperty('--color-bg', data.theme_colors.background || '#fcfbf7');
      root.style.setProperty('--color-card', data.theme_colors.cardBg || '#ffffff');
      root.style.setProperty('--color-text', data.theme_colors.text || '#1e293b');
    }

    // Dynamically load font links if needed
    const headingFont = data.font_heading || 'Outfit';
    const bodyFont = data.font_body || 'Plus Jakarta Sans';
    
    const fontId = 'mps-dynamic-fonts';
    let fontLink = document.getElementById(fontId) as HTMLLinkElement;
    if (!fontLink) {
      fontLink = document.createElement('link');
      fontLink.id = fontId;
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
    fontLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;600;700;800&family=${encodeURIComponent(bodyFont)}:wght@300;400;500;600;700&display=swap`;

    root.style.setProperty('--font-heading', `'${headingFont}', sans-serif`);
    root.style.setProperty('--font-body', `'${bodyFont}', sans-serif`);
  }, []);

  const applyDOMMetadata = useCallback((data: SiteSettings) => {
    if (!data) return;
    const seo = data.seo_meta || {};
    
    // Title
    const title = seo.meta_title || `${data.school_name || 'Model Public School'} (MPS Sikta) - ${data.tagline || 'Excellence in Education'}`;
    document.title = title;

    // Helper to set or update <meta> tag
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper for <link> tags
    const setLinkTag = (rel: string, href: string, type?: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      if (type) el.setAttribute('type', type);
      el.setAttribute('href', href);
    };

    // Default metadata values
    const defaultDesc = `${data.school_name || 'Model Public School'} at ${data.address || 'Bhawanipur, Sikta, West Champaran, Bihar'}. CBSE Affiliated school providing quality education, admissions, and campus facilities.`;
    const description = seo.meta_description || defaultDesc;
    const keywords = seo.meta_keywords || `Model Public School, MPS Sikta, School in Sikta, CBSE School Bhawanipur, Schools in West Champaran, West Champaran CBSE School, MPS Bhawanipur`;
    const image = seo.og_image || data.logo_url || '/logo.svg';
    const author = seo.author || `${data.school_name || 'Model Public School'} Management`;
    const robots = seo.robots || 'index, follow';
    const canonical = seo.canonical_url || window.location.origin;

    // Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    setMetaTag('meta[name="author"]', 'name', 'author', author);
    setMetaTag('meta[name="robots"]', 'name', 'robots', robots);

    // Open Graph Social Tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', data.school_name || 'Model Public School');
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');

    // Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    // Canonical link
    setLinkTag('canonical', canonical);

    // Dynamic Favicon and Apple Touch Icon
    const iconUrl = data.logo_url || '/logo.svg';
    setLinkTag('icon', iconUrl);
    setLinkTag('apple-touch-icon', iconUrl);
    setLinkTag('shortcut icon', iconUrl);

    // Schema.org JSON-LD Structured Data
    if (seo.enable_schema_markup !== false) {
      const schemaId = 'mps-schema-ld';
      let script = document.getElementById(schemaId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = schemaId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": data.school_name || "Model Public School",
        "alternateName": "MPS Sikta",
        "url": canonical,
        "logo": image,
        "description": description,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": data.address || "AT- Bhawanipur, P.O.- Kursi Barwa, Sikta",
          "addressLocality": "West Champaran",
          "addressRegion": "Bihar",
          "postalCode": "845307",
          "addressCountry": "IN"
        },
        "telephone": data.phones || "+91 9876543210",
        "email": data.email || "info@mpssikta.edu.in",
        "sameAs": [
          "https://maps.google.com/?q=Model+Public+School+Bhawanipur+Sikta+West+Champaran+Bihar"
        ]
      };
      script.text = JSON.stringify(schemaData);
    }
  }, []);

  const isEditingDOM = () => {
    if (typeof document === 'undefined') return false;
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || active.hasAttribute('contenteditable');
  };

  const fetchSettings = useCallback(async (silent = false) => {
    // Skip background overwriting if user is actively editing, focused on an input, or edited recently
    if (silent && (isEditingDOM() || Date.now() - lastLocalEditTimeRef.current < 10000)) {
      return;
    }

    try {
      // Use cached settings if available, revalidate in background
      const data = await api.getSettings(silent);
      if (data) {
        if (isEditingDOM() || Date.now() - lastLocalEditTimeRef.current < 10000) {
          return;
        }
        setSettings(prev => {
          if (prev && JSON.stringify(prev) === JSON.stringify(data)) {
            return prev;
          }
          return data;
        });
      }
    } catch (e) {
      if (!silent) {
        console.warn('Notice: Server settings endpoint unavailable, attempting direct Supabase query:', e);
      }
      try {
        const { data: supaRow } = await supabase.from('site_settings').select('data').eq('id', 1).maybeSingle();
        if (supaRow && supaRow.data) {
          const supabaseSettings = supaRow.data as SiteSettings;
          if (isEditingDOM() || Date.now() - lastLocalEditTimeRef.current < 10000) {
            return;
          }
          setSettings(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(supabaseSettings)) {
              return prev;
            }
            return supabaseSettings;
          });
        } else {
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            const localParsed = JSON.parse(saved);
            setSettings(prev => {
              if (prev && JSON.stringify(prev) === JSON.stringify(localParsed)) {
                return prev;
              }
              return localParsed;
            });
          }
        }
      } catch (err) {
        // Silent catch for invalid JSON or offline fallback
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (settings) {
      saveToLocalStorage(settings);
      applyThemeAndFonts(settings);
      applyDOMMetadata(settings);
    }
  }, [settings, applyThemeAndFonts, applyDOMMetadata]);

  useEffect(() => {
    fetchSettings();

    // 1. Direct Supabase real-time listener for site_settings table
    let settingsChannel: any = null;
    try {
      settingsChannel = supabase
        .channel('public:site_settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload: any) => {
          if (payload.new && (payload.new as any).data) {
            const supabaseData = (payload.new as any).data as SiteSettings;
            if (isEditingDOM() || Date.now() - lastLocalEditTimeRef.current < 10000) {
              return;
            }
            setSettings(prev => {
              if (prev && JSON.stringify(prev) === JSON.stringify(supabaseData)) {
                return prev;
              }
              return supabaseData;
            });
            setLoading(false);
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase channel subscription init notice:', err);
    }

    // 2. Live Background Polling every 30 seconds for backend API sync
    const pollInterval = setInterval(() => {
      fetchSettings(true);
    }, 30000);

    // 3. Refresh whenever window regains focus or visibility
    const handleFocus = () => fetchSettings(true);
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchSettings(true);
    };
    const handleCustomUpdate = () => fetchSettings(true);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mps_settings_updated', handleCustomUpdate);
    window.addEventListener('storage', handleCustomUpdate);

    return () => {
      if (settingsChannel) {
        supabase.removeChannel(settingsChannel);
      }
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mps_settings_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleCustomUpdate);
    };
  }, [fetchSettings, applyThemeAndFonts, applyDOMMetadata]);

  const updateSettings = useCallback(async (newSettings: Partial<SiteSettings>) => {
    const editTimestamp = Date.now();
    lastLocalEditTimeRef.current = editTimestamp;
    setSyncStatus('saving');
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);

    let nextSettings: SiteSettings | null = null;

    setSettings(prev => {
      if (!prev) return prev;

      const extraBlocks: Record<string, string> = {};
      if (newSettings.school_name !== undefined) {
        extraBlocks['header.schoolName'] = newSettings.school_name;
        extraBlocks['footer.schoolName'] = newSettings.school_name;
      }
      if (newSettings.principal_name !== undefined) {
        extraBlocks['about.principalName'] = newSettings.principal_name;
      }
      if (newSettings.principal_message !== undefined) {
        extraBlocks['about.principalMessage'] = newSettings.principal_message;
      }

      nextSettings = {
        ...prev,
        ...newSettings,
        content_blocks: {
          ...(prev.content_blocks || {}),
          ...(newSettings.content_blocks || {}),
          ...extraBlocks
        },
        theme_colors: {
          ...(prev.theme_colors || {}),
          ...(newSettings.theme_colors || {})
        },
        seo_meta: {
          ...(prev.seo_meta || {}),
          ...(newSettings.seo_meta || {})
        }
      };

      return nextSettings;
    });

    if (nextSettings) {
      const target = nextSettings as SiteSettings;
      // Direct Supabase upsert for client-side persistence
      try {
        const payload = JSON.parse(JSON.stringify(target));
        await supabase.from('site_settings').upsert({ id: 1, data: payload });
      } catch (e) {}

      // Async backend update
      try {
        const res = await api.updateSettings(target);
        setSyncStatus('saved');
        setLastSavedAt(Date.now());
        if (res && res.settings && lastLocalEditTimeRef.current <= editTimestamp) {
          saveToLocalStorage(res.settings);
          setSettings(res.settings);
        }
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => setSyncStatus('synced'), 3000);
      } catch (err) {
        console.error('Supabase settings sync error:', err);
        setSyncStatus('error');
      }
    }
  }, []);

  const updateContentBlock = useCallback(async (key: string, value: string) => {
    const editTimestamp = Date.now();
    lastLocalEditTimeRef.current = editTimestamp;
    setSyncStatus('saving');
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);

    let nextSettings: SiteSettings | null = null;

    setSettings(prev => {
      if (!prev) return prev;
      const updatedBlocks = { ...(prev.content_blocks || {}), [key]: value };
      const extraSettings: Partial<SiteSettings> = {};
      if (key === 'header.schoolName' || key === 'footer.schoolName') {
        extraSettings.school_name = value;
      } else if (key === 'about.principalName') {
        extraSettings.principal_name = value;
      } else if (key === 'about.principalMessage') {
        extraSettings.principal_message = value;
      }

      nextSettings = { ...prev, ...extraSettings, content_blocks: updatedBlocks };
      return nextSettings;
    });

    if (nextSettings) {
      try {
        const res = await api.updateContentBlock(key, value);
        setSyncStatus('saved');
        setLastSavedAt(Date.now());
        if (res && res.settings && lastLocalEditTimeRef.current <= editTimestamp) {
          saveToLocalStorage(res.settings);
          setSettings(res.settings);
        }
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => setSyncStatus('synced'), 3000);
      } catch (err) {
        console.error('Firestore content block sync error:', err);
        setSyncStatus('error');
      }
    }
  }, []);

  const getContentBlock = useCallback((key: string, fallback: string) => {
    const val = settings?.content_blocks?.[key];
    return (val !== undefined && val !== null) ? val : fallback;
  }, [settings?.content_blocks]);

  const contextValue = useMemo(() => ({
    settings,
    loading,
    syncStatus,
    lastSavedAt,
    updateSettings,
    updateContentBlock,
    getContentBlock,
    refreshSettings: fetchSettings
  }), [settings, loading, syncStatus, lastSavedAt, updateSettings, updateContentBlock, getContentBlock, fetchSettings]);

  return (
    <CMSContext.Provider value={contextValue}>
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) throw new Error('useCMS must be used within a CMSProvider');
  return context;
};
