import React from 'react';
import { useCMS } from '../../context/CMSContext';
import { EditableText } from './EditableText';
import { Phone, Mail, MapPin, School } from 'lucide-react';

export const Footer: React.FC = React.memo(() => {
  const { settings } = useCMS();

  return (
    <footer className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs py-12 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold overflow-hidden p-0.5 shadow-sm border border-slate-200 dark:border-slate-800 flex-shrink-0">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="MPS School Logo" className="w-full h-full object-contain" />
              ) : (
                <School className="w-4 h-4 text-white" />
              )}
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
              <EditableText blockKey="footer.schoolName" defaultText={settings?.school_name || 'Model Public School'} />
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-body">
            <EditableText blockKey="footer.tagline" defaultText="Empowering students with academic excellence, digital skills, and moral character in Sikta, West Champaran." />
          </p>
          <span className="inline-block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs">
            CBSE Affiliation No: {settings?.cbse_affiliation || '330854'}
          </span>
        </div>

        {/* Col 2 */}
        <div className="space-y-2 font-medium">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading mb-3">Quick Navigation</h4>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li><a href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Institution</a></li>
            <li><a href="#facilities" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Campus Infrastructure</a></li>
            <li><a href="#gallery" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Photo Gallery</a></li>
            <li><a href="#fees" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Fee Structure</a></li>
            <li><a href="#admissions" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Admissions 2026</a></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-2 font-medium">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading mb-3">Portals & Login</h4>
          <ul className="space-y-2">
            <li><a href="/portal" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-blue-600 dark:text-blue-400 font-bold">Student & Parent Portal</a></li>
            <li><a href="/teacher" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-700 dark:text-slate-300">Teacher Workspace</a></li>
            <li><a href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-slate-700 dark:text-slate-300">Admin Control Center</a></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-2 font-body">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-heading mb-3">Contact Information</h4>
          <p className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>{settings?.address || 'AT- Bhawanipur, P.O.- Kursi Barwa, Sikta, Bihar - 845307'}</span>
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>{settings?.phones || '+91 87579 68130, +91 91620 24642'}</span>
          </p>
          <p className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>{settings?.email || 'modelpublicschool@gmail.com'}</span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px]">
        <div>
          <p>© {new Date().getFullYear()} Model Public School (MPS Sikta). All rights reserved.</p>
          <p className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">Developed By Prakash Sah (2026)</p>
        </div>
        <p>CBSE Affiliation No. {settings?.cbse_affiliation || '330854'}</p>
      </div>
    </footer>
  );
});
