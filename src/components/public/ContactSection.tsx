import React from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from '../common/EditableText';
import { Card3DTilt } from '../common/Card3DTilt';
import { MapPin, Phone, Mail, Clock, School, ExternalLink } from 'lucide-react';

export const ContactSection: React.FC = React.memo(() => {
  const { settings } = useCMS();

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
                  Interactive Campus Location Map
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, West Champaran, Bihar - 845307
                </p>
              </div>

              <a
                href={`https://maps.google.com/?q=${encodeURIComponent('Model Public School Bhawanipur Sikta West Champaran Bihar')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex-shrink-0"
              >
                <span>Full Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
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
      </div>
    </section>
  );
});

