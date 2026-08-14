import React, { useState } from 'react';
import { useCMS } from '../../context/CMSContext';
import { useAuth } from '../../context/AuthContext';
import { EditableText } from './EditableText';
import { EditableImage } from './EditableImage';
import { Shield, Phone, Mail, UserCheck, GraduationCap, School, Menu, X, ShieldAlert, Moon, Sun, LogOut } from 'lucide-react';
import { api } from '../../lib/api';

export const Header: React.FC = React.memo(() => {
  const { settings, updateSettings } = useCMS();
  const { user, teacher, student, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('mps_dark_mode');
    if (saved === 'true') {
      document.documentElement.classList.add('dark');
      return true;
    } else if (saved === 'false') {
      document.documentElement.classList.remove('dark');
      return false;
    }
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mps_dark_mode', 'false');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mps_dark_mode', 'true');
      setIsDarkMode(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs transition-all duration-300">
      {/* Top Info Bar - Light Aesthetic */}
      <div className="bg-slate-100 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-[11px] py-1.5 px-4 hidden sm:block border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors">
              <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{settings?.phones || '+91 87579 68130, +91 91620 24642'}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors">
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{settings?.email || 'modelpublicschool@gmail.com'}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-medium">
            <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              CBSE Affiliation No: {settings?.cbse_affiliation || '330854'}
            </span>
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
              📍 Bhawanipur, Sikta, West Champaran (Bihar)
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 group">
          <div className="h-11 sm:h-12 max-w-[180px] rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800 flex-shrink-0 overflow-hidden p-1">
            {settings?.logo_url ? (
              <EditableImage
                src={settings.logo_url}
                alt="MPS Logo"
                className="max-h-full max-w-full w-auto h-auto object-contain"
                onSaveImage={(url) => updateSettings({ logo_url: url })}
              />
            ) : (
              <School className="w-5 h-5 text-slate-800" />
            )}
          </div>
          <div>
            <a href="/" className="hover:opacity-90 transition-opacity">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight font-heading tracking-tight">
                <EditableText blockKey="header.schoolName" defaultText={settings?.school_name || 'Model Public School'} />
              </h1>
            </a>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide flex items-center gap-1">
              <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <EditableText blockKey="header.locationBadge" defaultText="MPS Sikta, West Champaran" />
            </p>
          </div>
        </div>

        {/* Navigation Links Desktop */}
        <nav className="hidden lg:flex items-center gap-1 font-semibold text-xs text-slate-700 dark:text-slate-200">
          <a href="#about" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">About Us</a>
          <a href="#faculty" onMouseEnter={api.prefetchTeachers} className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Faculty</a>
          <a href="#facilities" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Facilities</a>
          <a href="#gallery" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Gallery</a>
          <a href="#fees" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Fee Structure</a>
          <a href="#faq" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">FAQ</a>
          <a href="#admissions" onMouseEnter={api.prefetchAdmissions} className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Admissions</a>
          <a href="#contact" className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-all">Contact</a>
        </nav>

        {/* Portal Login Action Buttons & Theme Switcher */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {(user || teacher || student) ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 pl-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                <span className="text-[10px] text-amber-500 dark:text-amber-400 font-black uppercase block">
                  {user?.role || (teacher ? 'Teacher' : 'Student')}
                </span>
                {user?.name || teacher?.name || student?.name}
              </div>
              <button
                onClick={logout}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1 transition-all"
                title="Logout from system"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <>
              <a
                href="/portal"
                onMouseEnter={() => { api.prefetchStudents(); api.prefetchNotices(); }}
                onFocus={() => { api.prefetchStudents(); api.prefetchNotices(); }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Portal</span>
              </a>

              <a
                href="/teacher"
                onMouseEnter={() => { api.prefetchTeachers(); api.prefetchStudents(); }}
                onFocus={() => { api.prefetchTeachers(); api.prefetchStudents(); }}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
              >
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Teacher</span>
              </a>

              <a
                href="/admin"
                onMouseEnter={() => { api.prefetchTeachers(); api.prefetchAdmissions(); api.prefetchNotices(); }}
                onFocus={() => { api.prefetchTeachers(); api.prefetchAdmissions(); api.prefetchNotices(); }}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs transition-all"
              >
                <ShieldAlert className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Admin</span>
              </a>
            </>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 space-y-3 text-sm font-medium animate-in slide-in-from-top-4">
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            About Us
          </a>
          <a
            href="#faculty"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            Faculty Members
          </a>
          <a
            href="#facilities"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            Facilities
          </a>
          <a
            href="#gallery"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            Gallery
          </a>
          <a
            href="#fees"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            Fee Structure
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            FAQ & Questions
          </a>
          <a
            href="#admissions"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            Admissions
          </a>
          <a
            href="#contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-800 dark:text-slate-200 hover:text-blue-600"
          >
            Contact Us
          </a>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <a
              href="/portal"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-extrabold py-2.5 rounded-xl text-center shadow-md"
            >
              <GraduationCap className="w-4 h-4" /> Student & Parent Portal
            </a>
            <div className="flex gap-2">
              <a
                href="/teacher"
                className="w-1/2 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-800 font-bold py-2 rounded-xl text-xs border border-slate-200"
              >
                <UserCheck className="w-4 h-4 text-blue-600" /> Teacher
              </a>
              <a
                href="/admin"
                className="w-1/2 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-800 font-bold py-2 rounded-xl text-xs border border-slate-200"
              >
                <ShieldAlert className="w-4 h-4 text-slate-600" /> Admin
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});
