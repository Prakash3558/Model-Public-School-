import {
  SiteSettings, Teacher, Student, AttendanceRecord, ExamResult, Homework, Notice, AdmissionApplication,
  OnlineClass, OnlineExam, TimeTableSlot, StudyMaterial, SchoolDiaryEntry, SyllabusItem, TransportRoute,
  AdmitCard, StudentDeclaration, SchoolMessage, RecordUpdateReq,
  FeeReceiptRecord, FinancialTransaction, FeeParticularMaster, FeeDiscount, AdvanceFeeRecord
} from '../types';
import { uploadImageToSupabaseStorage, uploadImageToFirebaseStorage } from './supabase';

export { uploadImageToSupabaseStorage, uploadImageToFirebaseStorage };

// In-memory cache for fast prefetching and instant response
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 60 seconds default TTL for ultra fast response times

import { supabase } from './supabase';

let currentAccessToken: string | null = null;

try {
  supabase.auth.getSession().then(({ data }) => {
    currentAccessToken = data?.session?.access_token || null;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    currentAccessToken = session?.access_token || null;
  });
} catch (e) {}

function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders
  };
  
  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }
  return headers;
}

function getFromCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setInCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export const api = {
  // Prefetch helpers
  prefetchSettings() { api.getSettings().catch(() => {}); },
  prefetchTeachers() { api.getTeachers().catch(() => {}); },
  prefetchStudents(className?: string, section?: string) { api.getStudents(className, section).catch(() => {}); },
  prefetchNotices() { api.getNotices().catch(() => {}); },
  prefetchAdmissions() { api.getAdmissions().catch(() => {}); },
  prefetchHomework(className?: string, section?: string) { api.getHomework(className, section).catch(() => {}); },
  prefetchAttendance(studentId?: string, className?: string, section?: string, date?: string) {
    api.getAttendance(studentId, className, section, date).catch(() => {});
  },
  prefetchExamResults(studentId?: string) { api.getExamResults(studentId).catch(() => {}); },

  async uploadFile(fileData: string | File | Blob, fileName?: string): Promise<{ success: boolean; url: string }> {
    try {
      const url = await uploadImageToSupabaseStorage(fileData, 'general', fileName);
      if (url) {
        return { success: true, url };
      }
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ fileData: typeof fileData === 'string' ? fileData : '', fileName }),
      });
      if (!res.ok) return { success: false, url: typeof fileData === 'string' ? fileData : '' };
      return res.json();
    } catch (e) {
      console.warn('File upload error:', e);
      return { success: false, url: typeof fileData === 'string' ? fileData : '' };
    }
  },

  async getSettings(forceRefresh = false): Promise<SiteSettings> {
    const key = 'settings';
    if (!forceRefresh) {
      const cached = getFromCache<SiteSettings>(key);
      if (cached) return cached;
    }
    const res = await fetch('/api/settings', { headers: await getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch site settings');
    const data = await res.json();
    setInCache(key, data);
    return data;
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<{ success: boolean; settings: SiteSettings }> {
    clearApiCache('settings');
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (data && data.settings) {
      setInCache('settings', data.settings);
    }
    return data;
  },

  async updateContentBlock(key: string, value: string): Promise<{ success: boolean; settings?: SiteSettings }> {
    clearApiCache('settings');
    const res = await fetch('/api/settings/content-block', {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ key, value }),
    });
    const data = await res.json();
    if (data && data.settings) {
      setInCache('settings', data.settings);
    }
    return data;
  },

  async login(payload: Record<string, any>) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async verifyMFA(payload: { userId: string; code: string; tempUser?: any; tempTeacher?: any; tempStudent?: any }) {
    const res = await fetch('/api/auth/verify-mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async changeAdminPassword(payload: { currentPassword: string; newUsername?: string; newPassword?: string; newPhone?: string }) {
    const res = await fetch('/api/auth/change-admin-password', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async forgotPassword(payload: { email?: string; username?: string; phone?: string }) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async signup(payload: { email: string; password?: string; name?: string; role?: string }) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getTeachers(forceRefresh = false): Promise<Teacher[]> {
    const key = 'teachers';
    if (!forceRefresh) {
      const cached = getFromCache<Teacher[]>(key);
      if (cached) return cached;
    }
    try {
      const res = await fetch('/api/teachers', { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      setInCache(key, result);
      return result;
    } catch (e) {
      console.warn('getTeachers fetch error:', e);
      return [];
    }
  },

  async createTeacher(teacher: Partial<Teacher>): Promise<{ success: boolean; teacher: Teacher }> {
    clearApiCache('teachers');
    const res = await fetch('/api/teachers', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(teacher),
    });
    return res.json();
  },

  async updateTeacher(id: string, teacher: Partial<Teacher>) {
    clearApiCache('teachers');
    const res = await fetch(`/api/teachers/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(teacher),
    });
    return res.json();
  },

  async deleteTeacher(id: string) {
    clearApiCache('teachers');
    const res = await fetch(`/api/teachers/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    return res.json();
  },

  async getStudents(className?: string, section?: string, forceRefresh = false): Promise<Student[]> {
    const key = `students_${className || ''}_${section || ''}`;
    if (!forceRefresh) {
      const cached = getFromCache<Student[]>(key);
      if (cached) return cached;
    }
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/students?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      setInCache(key, result);
      return result;
    } catch (e) {
      console.warn('getStudents fetch error:', e);
      return [];
    }
  },

  async createStudent(student: Partial<Student>): Promise<{ success: boolean; student: Student }> {
    clearApiCache('students');
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(student),
    });
    return res.json();
  },

  async updateStudent(id: string, student: Partial<Student>) {
    clearApiCache('students');
    const res = await fetch(`/api/students/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(student),
    });
    return res.json();
  },

  async deleteStudent(id: string) {
    clearApiCache('students');
    const res = await fetch(`/api/students/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    return res.json();
  },

  async getAttendance(studentId?: string, className?: string, section?: string, date?: string, forceRefresh = false): Promise<AttendanceRecord[]> {
    const key = `attendance_${studentId || ''}_${className || ''}_${section || ''}_${date || ''}`;
    if (!forceRefresh) {
      const cached = getFromCache<AttendanceRecord[]>(key);
      if (cached) return cached;
    }
    try {
      const query = new URLSearchParams();
      if (studentId) query.append('studentId', studentId);
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      if (date) query.append('date', date);
      const res = await fetch(`/api/attendance?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      setInCache(key, result);
      return result;
    } catch (e) {
      console.warn('getAttendance fetch error:', e);
      return [];
    }
  },

  async markAttendance(records: Partial<AttendanceRecord>[]) {
    clearApiCache('attendance');
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(records),
    });
    return res.json();
  },

  async getExamResults(studentId?: string, forceRefresh = false): Promise<ExamResult[]> {
    const key = `exam_${studentId || ''}`;
    if (!forceRefresh) {
      const cached = getFromCache<ExamResult[]>(key);
      if (cached) return cached;
    }
    try {
      const query = new URLSearchParams();
      if (studentId) query.append('studentId', studentId);
      const res = await fetch(`/api/exam-results?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      setInCache(key, result);
      return result;
    } catch (e) {
      console.warn('getExamResults fetch error:', e);
      return [];
    }
  },

  async saveExamResult(result: Partial<ExamResult>) {
    clearApiCache('exam');
    const res = await fetch('/api/exam-results', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(result),
    });
    return res.json();
  },

  async deleteExamResult(id: string) {
    clearApiCache('exam');
    const res = await fetch(`/api/exam-results/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    return res.json();
  },

  async getHomework(className?: string, section?: string, forceRefresh = false): Promise<Homework[]> {
    const key = `homework_${className || ''}_${section || ''}`;
    if (!forceRefresh) {
      const cached = getFromCache<Homework[]>(key);
      if (cached) return cached;
    }
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/homework?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      setInCache(key, result);
      return result;
    } catch (e) {
      console.warn('getHomework fetch error:', e);
      return [];
    }
  },

  async createHomework(homework: Partial<Homework>) {
    clearApiCache('homework');
    const res = await fetch('/api/homework', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(homework),
    });
    return res.json();
  },

  async deleteHomework(id: string) {
    clearApiCache('homework');
    const res = await fetch(`/api/homework/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    return res.json();
  },

  async updateHomework(id: string, homework: Partial<Homework>) {
    clearApiCache('homework');
    const res = await fetch(`/api/homework/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(homework),
    });
    return res.json();
  },

  async getNotices(forceRefresh = false): Promise<Notice[]> {
    const key = 'notices';
    if (!forceRefresh) {
      const cached = getFromCache<Notice[]>(key);
      if (cached) return cached;
    }
    try {
      const res = await fetch('/api/notices');
      if (!res.ok) return [];
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      setInCache(key, result);
      return result;
    } catch (e) {
      console.warn('getNotices fetch error:', e);
      return [];
    }
  },

  async createNotice(notice: Partial<Notice>) {
    clearApiCache('notices');
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(notice),
    });
    return res.json();
  },

  async deleteNotice(id: string) {
    clearApiCache('notices');
    const res = await fetch(`/api/notices/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    return res.json();
  },

  async getAdmissions(forceRefresh = false): Promise<AdmissionApplication[]> {
    const key = 'admissions';
    if (!forceRefresh) {
      const cached = getFromCache<AdmissionApplication[]>(key);
      if (cached) return cached;
    }
    try {
      const res = await fetch('/api/admissions', { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      const result = Array.isArray(data) ? data : [];
      setInCache(key, result);
      return result;
    } catch (e) {
      console.warn('getAdmissions fetch error:', e);
      return [];
    }
  },

  async createAdmission(admission: Partial<AdmissionApplication>) {
    clearApiCache('admissions');
    const res = await fetch('/api/admissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(admission),
    });
    return res.json();
  },

  async updateAdmissionStatus(id: string, status: string) {
    clearApiCache('admissions');
    const res = await fetch(`/api/admissions/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async deleteAdmission(id: string) {
    clearApiCache('admissions');
    const res = await fetch(`/api/admissions/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });
    return res.json();
  },

  // Online Classes
  async getOnlineClasses(className?: string, section?: string): Promise<OnlineClass[]> {
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/online-classes?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createOnlineClass(payload: Partial<OnlineClass>) {
    const res = await fetch('/api/online-classes', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async updateOnlineClass(id: string, payload: Partial<OnlineClass>) {
    const res = await fetch(`/api/online-classes/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteOnlineClass(id: string) {
    const res = await fetch(`/api/online-classes/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },

  // Online Exams
  async getOnlineExams(className?: string, section?: string): Promise<OnlineExam[]> {
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/online-exams?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createOnlineExam(payload: Partial<OnlineExam>) {
    const res = await fetch('/api/online-exams', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async updateOnlineExam(id: string, payload: Partial<OnlineExam>) {
    const res = await fetch(`/api/online-exams/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteOnlineExam(id: string) {
    const res = await fetch(`/api/online-exams/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },

  // Time Table
  async getTimeTable(className?: string, section?: string): Promise<TimeTableSlot[]> {
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/timetable?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createTimeTableSlot(payload: Partial<TimeTableSlot>) {
    const res = await fetch('/api/timetable', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteTimeTableSlot(id: string) {
    const res = await fetch(`/api/timetable/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },
  async updateTimeTableSlot(id: string, payload: Partial<TimeTableSlot>) {
    const res = await fetch(`/api/timetable/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Study Material
  async getStudyMaterial(className?: string, section?: string): Promise<StudyMaterial[]> {
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/study-material?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createStudyMaterial(payload: Partial<StudyMaterial>) {
    const res = await fetch('/api/study-material', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteStudyMaterial(id: string) {
    const res = await fetch(`/api/study-material/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },
  async updateStudyMaterial(id: string, payload: Partial<StudyMaterial>) {
    const res = await fetch(`/api/study-material/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // School Diary
  async getSchoolDiary(className?: string, section?: string): Promise<SchoolDiaryEntry[]> {
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/school-diary?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createSchoolDiary(payload: Partial<SchoolDiaryEntry>) {
    const res = await fetch('/api/school-diary', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteSchoolDiary(id: string) {
    const res = await fetch(`/api/school-diary/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },
  async updateSchoolDiary(id: string, payload: Partial<SchoolDiaryEntry>) {
    const res = await fetch(`/api/school-diary/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Syllabus
  async getSyllabus(className?: string, section?: string): Promise<SyllabusItem[]> {
    try {
      const query = new URLSearchParams();
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/syllabus?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createSyllabus(payload: Partial<SyllabusItem>) {
    const res = await fetch('/api/syllabus', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteSyllabus(id: string) {
    const res = await fetch(`/api/syllabus/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },
  async updateSyllabus(id: string, payload: Partial<SyllabusItem>) {
    const res = await fetch(`/api/syllabus/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Transport
  async getTransport(): Promise<TransportRoute[]> {
    try {
      const res = await fetch('/api/transport', { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createTransport(payload: Partial<TransportRoute>) {
    const res = await fetch('/api/transport', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async updateTransport(id: string, payload: Partial<TransportRoute>) {
    const res = await fetch(`/api/transport/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteTransport(id: string) {
    const res = await fetch(`/api/transport/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },

  // Admit Cards
  async getAdmitCards(studentId?: string): Promise<AdmitCard[]> {
    try {
      const query = new URLSearchParams();
      if (studentId) query.append('studentId', studentId);
      const res = await fetch(`/api/admit-cards?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createAdmitCard(payload: Partial<AdmitCard>) {
    const res = await fetch('/api/admit-cards', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteAdmitCard(id: string) {
    const res = await fetch(`/api/admit-cards/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },
  async updateAdmitCard(id: string, payload: Partial<AdmitCard>) {
    const res = await fetch(`/api/admit-cards/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Declarations
  async getDeclarations(): Promise<StudentDeclaration[]> {
    try {
      const res = await fetch('/api/declarations', { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createDeclaration(payload: Partial<StudentDeclaration>) {
    const res = await fetch('/api/declarations', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteDeclaration(id: string) {
    const res = await fetch(`/api/declarations/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },
  async updateDeclaration(id: string, payload: Partial<StudentDeclaration>) {
    const res = await fetch(`/api/declarations/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Write To School Messages
  async getSchoolMessages(studentId?: string, className?: string, section?: string): Promise<SchoolMessage[]> {
    try {
      const query = new URLSearchParams();
      if (studentId) query.append('studentId', studentId);
      if (className) query.append('class', className);
      if (section) query.append('section', section);
      const res = await fetch(`/api/school-messages?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createSchoolMessage(payload: Partial<SchoolMessage>) {
    const res = await fetch('/api/school-messages', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async updateSchoolMessage(id: string, payload: Partial<SchoolMessage>) {
    const res = await fetch(`/api/school-messages/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async deleteSchoolMessage(id: string) {
    const res = await fetch(`/api/school-messages/${id}`, { method: 'DELETE', headers: await getAuthHeaders() });
    return res.json();
  },

  // Record Updates
  async getRecordUpdates(studentId?: string): Promise<RecordUpdateReq[]> {
    try {
      const query = new URLSearchParams();
      if (studentId) query.append('studentId', studentId);
      const res = await fetch(`/api/record-updates?${query.toString()}`, { headers: await getAuthHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },
  async createRecordUpdate(payload: Partial<RecordUpdateReq>) {
    const res = await fetch('/api/record-updates', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },
  async updateRecordStatus(id: string, status: string) {
    const res = await fetch(`/api/record-updates/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Get Single Student Profile
  async getStudent(id: string): Promise<Student | null> {
    try {
      const res = await fetch(`/api/students/${id}`, { headers: await getAuthHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('getStudent fetch error:', e);
      return null;
    }
  },

  // Finance API
  async getFinanceData(): Promise<{
    feeReceipts: FeeReceiptRecord[];
    transactions: FinancialTransaction[];
    teacherSalaries: Record<string, { status: 'Paid' | 'Pending'; paidDate?: string; amount: number; month: string }>;
    feeParticulars: FeeParticularMaster[];
    feeDiscounts: FeeDiscount[];
    advanceRecords: AdvanceFeeRecord[];
  }> {
    try {
      const res = await fetch('/api/finance/data', { headers: await getAuthHeaders() });
      if (!res.ok) return { feeReceipts: [], transactions: [], teacherSalaries: {}, feeParticulars: [], feeDiscounts: [], advanceRecords: [] };
      return await res.json();
    } catch (e) {
      console.warn('getFinanceData fetch error:', e);
      return { feeReceipts: [], transactions: [], teacherSalaries: {}, feeParticulars: [], feeDiscounts: [], advanceRecords: [] };
    }
  },
  async saveFeeReceipt(receipt: FeeReceiptRecord) {
    const res = await fetch('/api/finance/receipts', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(receipt)
    });
    return res.json();
  },
  async saveTransaction(transaction: FinancialTransaction) {
    const res = await fetch('/api/finance/transactions', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(transaction)
    });
    return res.json();
  },
  async updateTeacherSalaries(salaries: Record<string, { status: 'Paid' | 'Pending'; paidDate?: string; amount: number; month: string }>) {
    const res = await fetch('/api/finance/teacher-salaries', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(salaries)
    });
    return res.json();
  },
  async saveFeeParticular(particular: FeeParticularMaster) {
    const res = await fetch('/api/finance/particulars', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(particular)
    });
    return res.json();
  },
  async saveFeeDiscount(discount: FeeDiscount) {
    const res = await fetch('/api/finance/discounts', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(discount)
    });
    return res.json();
  },
  async saveAdvanceRecord(advance: AdvanceFeeRecord) {
    const res = await fetch('/api/finance/advances', {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(advance)
    });
    return res.json();
  }
};


