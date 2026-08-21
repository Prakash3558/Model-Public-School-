import React, { useState } from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { Card3DTilt } from '../common/Card3DTilt';
import { MapPin, Phone, Mail, Clock, School, ExternalLink, Navigation, Sparkles, Send, Compass, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';
import ReactMarkdown from 'react-markdown';

export const ContactSection: React.FC = React.memo(() => {
  const { settings } = useCMS();

  // Quick route question state for Google Maps Grounding
  const [routeQuery, setRouteQuery] = useState('');
  const [routeAnswer, setRouteAnswer] = useState<string | null>(null);
  const [mapsPlaces, setMapsPlaces] = useState<Array<{ title?: string; uri?: string; reviewSnippets?: string[] }>>([]);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleAskMapsAI = async (customQuery?: string) => {
    const query = (customQuery || routeQuery).trim();
    if (!query) return;

    setIsQuerying(true);
    setRouteAnswer(null);
    setMapsPlaces([]);

    try {
      const res = await api.sendAIChat({
        message: query,
        role: 'maps_guide',
        enableMaps: true,
        userLocation: { latitude: 26.897, longitude: 84.582 }
      });
      setRouteAnswer(res.reply);
      if (res.mapsPlaces && res.mapsPlaces.length > 0) {
        setMapsPlaces(res.mapsPlaces);
      }
    } catch (e: any) {
      setRouteAnswer(`To reach Model Public School Sikta, travel to Bhawanipur via Sikta main road (2.5 km from Sikta Railway Station, 28 km from Bettiah).`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 dark:bg-slate-900/60 transition-colors">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Campus Location & Contact
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-heading">
            <EditableText blockKey="contact.heading" defaultText="Get in Touch with Our Campus" />
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <EditableText blockKey="contact.subtext" defaultText="Visit our administrative block at Bhawanipur, Sikta or call us for admissions, campus tours, and academic queries." />
          </p>
        </div>

        {/* Clean Single Grid: Left Column Contact Card, Right Column Google Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          {/* Left Column: Contact Card */}
          <div className="lg:col-span-5">
            <Card3DTilt maxTilt={8} scaleOnHover={1.01} className="h-full">
              <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-xl border border-slate-800 flex flex-col justify-between space-y-6 h-full">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 overflow-hidden p-1">
                      {settings?.logo_url ? (
                        <img src={settings.logo_url} alt="MPS Logo" className="w-full h-full object-contain" />
                      ) : (
                        <School className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg font-heading text-white">
                        {settings?.school_name || 'Model Public School'}
                      </h3>
                      <p className="text-xs text-amber-400 font-bold">CBSE Affiliation No. {settings?.cbse_affiliation || '330854'}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-300 font-body">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Campus Address:</strong>
                        <p className="text-slate-400 leading-relaxed">
                          {settings?.address || 'AT- Bhawanipur, P.O.- Kursi Barwa, P.S.- Sikta, West Champaran, Bihar - 845307'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Helpline Phone Numbers:</strong>
                        <p className="text-slate-400">
                          {settings?.phones || '+91 87579 68130, +91 91620 24642'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Official Email:</strong>
                        <p className="text-slate-400">
                          {settings?.email || 'modelpublicschool@gmail.com'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white font-bold mb-0.5">Office Timings:</strong>
                        <p className="text-slate-400">Monday to Saturday: 8:00 AM – 3:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>West Champaran, Bihar</span>
                  <span className="text-amber-400 font-bold">India - 845307</span>
                </div>
              </div>
            </Card3DTilt>
          </div>

          {/* Right Column: Interactive Google Maps Frame */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between min-h-[420px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span>Interactive Campus Location Map</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live GPS
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran, Bihar - 845307
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent('Model Public School Bhawanipur Sikta West Champaran Bihar')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex-shrink-0"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="w-full h-80 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950">
              <iframe
                src="https://maps.google.com/maps?q=Model+Public+School+Bhawanipur+Sikta+West+Champaran+Bihar&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
                title="Model Public School Google Maps View"
                className="w-full h-full filter contrast-[1.02]"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Gemini Maps Grounding AI Navigator Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-heading text-white">
                    Google Maps AI Route & Transport Navigator
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Gemini Maps Grounded
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Ask AI for real-time travel routes, distances, and nearby transit from any town in Bihar or Nepal.
                </p>
              </div>
            </div>

            {/* Quick Route Preset Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                'From Bettiah Bus Stand',
                'From Raxaul Station',
                'From Sikta Railway Station',
                'From Motihari'
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRouteQuery(`How to reach Model Public School Sikta ${preset}?`);
                    handleAskMapsAI(`How to reach Model Public School Sikta ${preset}?`);
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-700 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskMapsAI();
            }}
            className="flex flex-col sm:flex-row gap-2 mb-4"
          >
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={routeQuery}
                onChange={(e) => setRouteQuery(e.target.value)}
                placeholder="Ask route... e.g. How to reach MPS Sikta from Bettiah or nearby railway station?"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isQuerying || !routeQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0"
            >
              {isQuerying ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <span>Grounding Maps...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Get Directions</span>
                </>
              )}
            </button>
          </form>

          {/* Grounded Result Display */}
          {routeAnswer && (
            <div className="mt-4 bg-slate-950/90 border border-emerald-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Navigation className="w-4 h-4" />
                  <span>Route Guidance & Place Details</span>
                </div>
                <button
                  onClick={() => {
                    setRouteAnswer(null);
                    setMapsPlaces([]);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed prose prose-invert prose-p:my-1.5 prose-strong:text-amber-300">
                <ReactMarkdown>{routeAnswer}</ReactMarkdown>
              </div>

              {/* Grounded Google Maps Links & Review Cards */}
              {mapsPlaces.length > 0 && (
                <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {mapsPlaces.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-emerald-500/40 rounded-xl flex items-start justify-between gap-2 group transition-all"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">
                          {place.title || 'View on Google Maps'}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {place.reviewSnippets?.[0] || 'Open direct location & navigation in Maps'}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
});


