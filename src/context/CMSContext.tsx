import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { SiteSettings } from '../types';
import { api, defaultSiteSettings } from '../lib/api';

interface CMSContextType {
  settings: SiteSettings;
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
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultSiteSettings,
          ...parsed,
          content_blocks: {
            ...defaultSiteSettings.content_blocks,
            ...(parsed.content_blocks || {})
          },
          theme_colors: {
            ...defaultSiteSettings.theme_colors,
            ...(parsed.theme_colors || {})
          }
        };
      }
    } catch (e) {
      console.error('Failed to read settings from localStorage:', e);
    }
    return defaultSiteSettings;
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
      const schoolName = data.school_name || "Model Public School";
      const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "School",
            "@id": `${canonical}#school`,
            "name": schoolName,
            "alternateName": [
              "MPS Sikta",
              "Model Public School Sikta",
              "Model Public School Bhawanipur"
            ],
            "url": canonical,
            "logo": {
              "@type": "ImageObject",
              "url": image,
              "caption": `${schoolName} Logo`
            },
            "image": image,
            "description": description,
            "telephone": data.phones || "+91 8757968130",
            "email": data.email || "modelpublicschool@gmail.com",
            "priceRange": "₹₹",
            "currenciesAccepted": "INR",
            "paymentAccepted": "Cash, Credit Card, UPI, Net Banking",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": data.address || "AT- Bhawanipur, P.O.- Kursi Barwa, Sikta",
              "addressLocality": "West Champaran",
              "addressRegion": "Bihar",
              "postalCode": "845307",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 26.9063,
              "longitude": 84.5054
            },
            "hasCredential": [
              {
                "@type": "EducationalOccupationalCredential",
                "credentialCategory": "CBSE Affiliation",
                "recognizedBy": {
                  "@type": "Organization",
                  "name": "Central Board of Secondary Education (CBSE)"
                }
              }
            ],
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "bestRating": "5",
              "worstRating": "1",
              "ratingCount": "194"
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "07:30",
                "closes": "14:00"
              }
            ],
            "sameAs": [
              "https://www.facebook.com",
              "https://maps.google.com/?q=Model+Public+School+Bhawanipur+Sikta+West+Champaran+Bihar"
            ]
          },
          {
            "@type": "WebSite",
            "@id": `${canonical}#website`,
            "url": canonical,
            "name": schoolName,
            "publisher": {
              "@id": `${canonical}#school`
            },
            "inLanguage": "en-IN",
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${canonical}?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${canonical}#breadcrumbs`,
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": canonical },
              { "@type": "ListItem", "position": 2, "name": "Admissions 2026", "item": `${canonical}#admissions` },
              { "@type": "ListItem", "position": 3, "name": "Fee Structure", "item": `${canonical}#fees` },
              { "@type": "ListItem", "position": 4, "name": "Facilities & Labs", "item": `${canonical}#facilities` },
              { "@type": "ListItem", "position": 5, "name": "FAQ", "item": `${canonical}#faq` },
              { "@type": "ListItem", "position": 6, "name": "Student Portal", "item": `${canonical}portal` }
            ]
          },
          {
            "@type": "FAQPage",
            "@id": `${canonical}#faq`,
            "mainEntity": [
              {
                "@type": "Question",
                "name": `How do I apply for admission to ${schoolName} (MPS Sikta) for session 2026–2027?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Admissions for the 2026–2027 academic session are currently open from Nursery to Class 10. Parents can register online via the Admissions portal on this website, or visit the school campus accounts desk at Bhawanipur, Sikta, West Champaran."
                }
              },
              {
                "@type": "Question",
                "name": `Is ${schoolName} affiliated with CBSE?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `Yes, ${schoolName} (MPS Sikta) is a recognized CBSE English Medium educational institution with Affiliation Number ${data.cbse_affiliation || '330854'} and official UDISE Code ${data.udise_code || '10011503402'}.`
                }
              },
              {
                "@type": "Question",
                "name": `Where is ${schoolName} located in West Champaran, Bihar?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `The school campus is located at ${data.address || 'Bhawanipur, Post Office: Kursi Barwa, Sikta, West Champaran, Bihar - 845307'}.`
                }
              }
            ]
          }
        ]
      };
      script.text = JSON.stringify(schemaData);
    }

    // Google Search Console Verification
    if (seo.google_search_console_id) {
      setMetaTag('meta[name="google-site-verification"]', 'name', 'google-site-verification', seo.google_search_console_id);
    }

    // Google AdSense Account Verification Meta Tag & Script
    const adsenseId = seo.google_adsense_id || data.google_adsense_id;
    if (adsenseId) {
      setMetaTag('meta[name="google-adsense-account"]', 'name', 'google-adsense-account', adsenseId);
      
      const adsenseScriptId = 'google-adsense-script';
      let adsenseScript = document.getElementById(adsenseScriptId) as HTMLScriptElement;
      if (!adsenseScript && seo.enable_adsense !== false) {
        adsenseScript = document.createElement('script');
        adsenseScript.id = adsenseScriptId;
        adsenseScript.async = true;
        adsenseScript.crossOrigin = 'anonymous';
        adsenseScript.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseId)}`;
        document.head.appendChild(adsenseScript);
      }
    }

    // Google Analytics (gtag.js)
    if (seo.google_analytics_id) {
      const gtagScriptId = 'google-analytics-gtag';
      let gtagScript = document.getElementById(gtagScriptId) as HTMLScriptElement;
      if (!gtagScript) {
        gtagScript = document.createElement('script');
        gtagScript.id = gtagScriptId;
        gtagScript.async = true;
        gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(seo.google_analytics_id)}`;
        document.head.appendChild(gtagScript);

        const inlineGtag = document.createElement('script');
        inlineGtag.id = 'google-analytics-init';
        inlineGtag.text = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${seo.google_analytics_id}');
        `;
        document.head.appendChild(inlineGtag);
      }
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
    // Skip background overwriting if user is actively editing or edited recently
    if (silent && (isEditingDOM() || Date.now() - lastLocalEditTimeRef.current < 8000)) {
      return;
    }

    try {
      // 1. Fetch live settings (api.getSettings handles API + direct Supabase fallback)
      const data = await api.getSettings(silent);
      if (data && data.school_name) {
        if (isEditingDOM() || Date.now() - lastLocalEditTimeRef.current < 8000) {
          return;
        }
        saveToLocalStorage(data);
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
        if (supaRow && supaRow.data && (supaRow.data as any).school_name) {
          const supabaseSettings = supaRow.data as SiteSettings;
          if (isEditingDOM() || Date.now() - lastLocalEditTimeRef.current < 8000) {
            return;
          }
          saveToLocalStorage(supabaseSettings);
          setSettings(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(supabaseSettings)) {
              return prev;
            }
            return supabaseSettings;
          });
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
    const handleFocus = () => {
      setTimeout(() => fetchSettings(true), 0);
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => fetchSettings(true), 0);
      }
    };
    const handleCustomUpdate = () => {
      if (Date.now() - lastLocalEditTimeRef.current < 3000) return;
      setTimeout(() => fetchSettings(true), 0);
    };

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
      saveToLocalStorage(target);
      setTimeout(() => window.dispatchEvent(new Event('mps_settings_updated')), 0);

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
      const target = nextSettings as SiteSettings;
      saveToLocalStorage(target);
      setTimeout(() => window.dispatchEvent(new Event('mps_settings_updated')), 0);

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
