import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/settingsStore';
import { useCoursesStore } from '../stores/coursesStore';
import { useHolidayStore } from '../stores/holidayStore';
import { useToastStore } from '../stores/toastStore';
import { auth, googleProvider, functions } from '../lib/firebase';
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { pullFromFirestore } from '../lib/firestore';
import { httpsCallable } from 'firebase/functions';
import * as pdfjsLib from 'pdfjs-dist';

// Use the local worker file bundled by Vite instead of an external CDN
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const UNIVERSITIES = ['UPES', 'IIT Delhi', 'BITS Pilani', 'Delhi University', 'Other University'];
const SCHEMES = ['UPES 10-pt scale', 'Standard 10.0 GPA', 'Percentage (%)', '4.0 Scale (US)'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type LocalCourse = { 
  id: string;
  name: string;
  code: string;
  scheduleDays: string[];
  time: string;
  room: string;
  creditHours: number;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { setProfile, completeOnboarding, setNotifications, setSemesterDates } = useSettingsStore();
  const addCourse = useCoursesStore((s) => s.addCourse);
  const initHolidays = useHolidayStore((s) => s.initializeDefaults);
  const addToast = useToastStore((s) => s.addToast);
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('UPES');
  const [scheme, setScheme] = useState('UPES 10-pt scale');
  const [authError, setAuthError] = useState('');
  const [semStart, setSemStart] = useState('');
  const [semEnd, setSemEnd] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [localCourses, setLocalCourses] = useState<LocalCourse[]>([]);


  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!auth) return;
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const hydrated = await pullFromFirestore();
          if (hydrated) {
            sessionStorage.setItem('scholify_session_active', 'true');
            window.location.href = '/';
          } else {
            if (result.user.displayName) setName(result.user.displayName);
            completeOnboarding();
            sessionStorage.setItem('scholify_session_active', 'true');
            navigate('/', { replace: true });
          }
        }
      } catch (err: any) {
        setAuthError(err.message || 'Authentication failed');
      }
    };
    handleRedirectResult();
  }, [navigate, completeOnboarding]);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setAuthError('Firebase is not configured. Please add your credentials to src/lib/firebase.ts file.');
      return;
    }
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!auth?.currentUser) {
      alert("Please sign in with Google first before using the AI PDF Extraction.");
      return;
    }

    setExtracting(true);
    try {
      // 1. Extract raw text from PDF on the frontend
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let rawText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        rawText += pageText + '\n';
      }

      // 2. Call the Firebase Cloud Function
      const extractTimetableFn = httpsCallable(functions, 'extractTimetable');
      const response = await extractTimetableFn({ pdfText: rawText });
      
      const data = response.data as { courses: any[] };
      // Frontend deduplication merge
      const courseMap = new Map<string, LocalCourse>();
      for (const c of data.courses) {
        const key = (c.name || '').trim().toLowerCase();
        if (courseMap.has(key)) {
          const existing = courseMap.get(key)!;
          const allDays = new Set([...existing.scheduleDays, ...(c.scheduleDays || [])]);
          existing.scheduleDays = Array.from(allDays);
        } else {
          courseMap.set(key, { ...c, id: crypto.randomUUID() });
        }
      }
      const newCourses = Array.from(courseMap.values());
      setLocalCourses((prev) => [...prev, ...newCourses]);
      addToast(`Extracted ${newCourses.length} courses successfully!`, 'success');
    } catch (error: any) {
      console.error("Extraction error:", error);
      addToast(error.message || "Failed to parse timetable.", 'error', 5000);
    } finally {
      setExtracting(false);
    }
  };

  const updateCourse = (id: string, field: string, value: any) => {
    setLocalCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const toggleDay = (id: string, day: string) => {
    setLocalCourses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const days = c.scheduleDays.includes(day)
          ? c.scheduleDays.filter((d) => d !== day)
          : [...c.scheduleDays, day];
        return { ...c, scheduleDays: days };
      })
    );
  };

  const deleteCourse = (id: string) => {
    setLocalCourses((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddManualCourse = () => {
    setLocalCourses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: '',
        code: '',
        scheduleDays: [],
        time: '',
        room: '',
        creditHours: 3,
      },
    ]);
  };

  const handleComplete = () => {
    setProfile(name || 'Student', university);
    if (semStart && semEnd) setSemesterDates(semStart, semEnd);
    initHolidays(); // Seed Indian govt holidays

    const existingCourses = useCoursesStore.getState().courses;

    localCourses.forEach((course) => {
      if (course.name.trim() || course.code.trim()) {
        const isDuplicate = existingCourses.some(
          (c) => c.name.toLowerCase() === (course.name || '').toLowerCase() || c.code === course.code
        );

        if (!isDuplicate) {
          addCourse({
            name: course.name || 'Untitled Course',
            code: course.code || 'UNKNOWN',
            scheduleDays: course.scheduleDays,
            time: course.time || '10:00 AM',
            room: course.room || 'TBA',
            semesterStartDate: semStart || new Date().toISOString(),
            totalClassesHeld: 0,
            totalAttended: 0,
            attendanceThreshold: 75,
            creditHours: course.creditHours,
          });
        }
      }
    });

    if ('Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setNotifications(perm === 'granted');
      });
    }

    completeOnboarding();
    sessionStorage.setItem('scholify_session_active', 'true');
    addToast('Welcome to Scholify! Your setup is complete.', 'success');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-rf-base relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-rf-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto px-6 pt-12 pb-24 md:pt-20 relative z-10"
      >
        <header className="text-center mb-12">
          <img src="/scholify-logo.png" alt="Scholify" className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-[0_8px_32px_rgba(0,212,255,0.2)] border border-rf-cyan-dim object-contain" />
          <h1 className="font-headline font-extrabold text-4xl tracking-tight text-white mb-2">
            Scholify
          </h1>
          <p className="font-body text-gray-400 text-lg">Smart Academic Companion</p>
        </header>

        <div className="space-y-8">
          {/* Personal Information */}
          <section className="rf-card p-6">
            <h2 className="font-headline font-bold text-xl mb-6 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-rf-cyan">person</span>
              Personal Details
            </h2>

            <div className="mb-6">
              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>
              {authError && (
                <p className="text-rf-red text-xs mt-2 text-center font-medium bg-rf-red/10 py-2 rounded-lg border border-rf-red/20">{authError}</p>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-rf-cyan-dim/20 flex-1"></div>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">OR ENTER MANUALLY</span>
              <div className="h-px bg-rf-cyan-dim/20 flex-1"></div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-label font-medium text-sm text-gray-400 ml-1">Student Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 px-5 text-white rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label font-medium text-sm text-gray-400 ml-1">University</label>
                <div className="relative">
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full h-14 px-5 text-white rounded-xl pr-10"
                  >
                    {UNIVERSITIES.map((u) => (
                      <option key={u} value={u} className="bg-rf-card text-white">{u}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
                </div>
              </div>
            </div>
          </section>

          {/* Setup Timetable */}
          <section className="rf-card p-6">
            <h2 className="font-headline font-bold text-xl mb-6 flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-rf-cyan">calendar_month</span>
              Setup Timetable
            </h2>
            <div className="space-y-5">

              {/* Semester Dates */}
              <div className="space-y-3 mb-6 border-b border-rf-cyan-dim/20 pb-6">
                <label className="font-label font-medium text-sm text-gray-400 ml-1">Semester Period</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block ml-1">Start Date</label>
                    <input
                      type="date"
                      value={semStart}
                      onChange={(e) => setSemStart(e.target.value)}
                      className="w-full h-12 px-4 text-sm text-white rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block ml-1">End Date</label>
                    <input
                      type="date"
                      value={semEnd}
                      onChange={(e) => setSemEnd(e.target.value)}
                      className="w-full h-12 px-4 text-sm text-white rounded-xl"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 ml-1">Used to calculate total classes and attendance projections</p>
              </div>
              
              {/* Grading Scheme (Moved here to group Academic details) */}
              <div className="space-y-2 mb-6 border-b border-rf-cyan-dim/20 pb-6">
                <label className="font-label font-medium text-sm text-gray-400 ml-1">Grading Scheme</label>
                <div className="relative">
                  <select
                    value={scheme}
                    onChange={(e) => setScheme(e.target.value)}
                    className="w-full h-14 px-5 text-white rounded-xl pr-10 bg-rf-surface"
                  >
                    {SCHEMES.map((s) => (
                      <option key={s} value={s} className="bg-rf-card text-white">{s}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">tune</span>
                </div>
              </div>

              {/* Action Buttons for Adding Courses */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-rf-surface border border-rf-cyan-dim border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-rf-cyan/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-rf-cyan text-2xl">document_scanner</span>
                  <span className="text-xs font-bold text-white text-center">Auto-Extract<br/><span className="text-[10px] text-gray-500 font-normal">PDF or Image</span></span>
                </button>
                <button
                  onClick={handleAddManualCourse}
                  className="bg-rf-surface border border-rf-cyan-dim rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-rf-cyan/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-rf-green text-2xl">add_card</span>
                  <span className="text-xs font-bold text-white text-center">Add Manually<br/><span className="text-[10px] text-gray-500 font-normal">Custom Class</span></span>
                </button>
              </div>

              <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />

              {extracting && (
                <div className="flex items-center justify-center gap-2 text-rf-cyan py-4 animate-pulse">
                  <span className="material-symbols-outlined">analytics</span>
                  <span className="text-sm font-bold">Extracting schedule data...</span>
                </div>
              )}

              {/* Editable Class List */}
              {localCourses.length > 0 && (
                <div className="space-y-4 mt-6 pt-4 border-t border-rf-cyan-dim/20">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between">
                    Your Classes
                    <span className="text-[10px] font-medium text-gray-500 rf-number">{localCourses.length} total</span>
                  </h3>
                  
                  {localCourses.map((course) => (
                    <div key={course.id} className="bg-rf-surface rounded-xl border border-rf-cyan-dim/30 p-4 space-y-3 relative overflow-hidden group">
                      <button 
                        onClick={() => deleteCourse(course.id)}
                        className="absolute top-3 right-3 text-gray-500 hover:text-rf-red transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>

                      <div className="grid grid-cols-3 gap-3 pr-8">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Course Name</label>
                          <input 
                            value={course.name} onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                            placeholder="e.g. Mathematics" 
                            className="w-full bg-transparent text-sm font-bold text-white border-b border-gray-700 focus:border-rf-cyan outline-none pb-1"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Code</label>
                          <input 
                            value={course.code} onChange={(e) => updateCourse(course.id, 'code', e.target.value)}
                            placeholder="MA101" 
                            className="w-full bg-transparent text-sm font-bold text-rf-cyan border-b border-gray-700 focus:border-rf-cyan outline-none pb-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> Time</label>
                          <input 
                            value={course.time} onChange={(e) => updateCourse(course.id, 'time', e.target.value)}
                            placeholder="09:00 AM" 
                            className="w-full bg-transparent text-xs text-white border-b border-gray-700 focus:border-rf-cyan outline-none pb-1 rf-number"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span> Room</label>
                          <input 
                            value={course.room} onChange={(e) => updateCourse(course.id, 'room', e.target.value)}
                            placeholder="Room Number" 
                            className="w-full bg-transparent text-xs text-white border-b border-gray-700 focus:border-rf-cyan outline-none pb-1 rf-number"
                          />
                        </div>
                      </div>

                      {/* Day Picker */}
                      <div className="pt-2">
                        <div className="flex justify-between gap-1">
                          {DAYS.map((day) => (
                            <button
                              key={day}
                              onClick={() => toggleDay(course.id, day)}
                              className={`flex-1 py-1.5 rounded text-[10px] font-bold transition-all ${
                                course.scheduleDays.includes(day)
                                  ? 'bg-rf-cyan text-white'
                                  : 'bg-rf-card text-gray-500 hover:text-white'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </section>

          {/* Complete Setup Button */}
          <footer className="pt-4">
            <button
              onClick={handleComplete}
              className="w-full rf-btn-primary font-headline text-lg h-16 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.97] transition-all"
            >
              Complete Setup
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="text-center text-gray-600 text-sm mt-6 px-8">
              By continuing, you agree to Scholify's{' '}
              <a className="text-rf-cyan font-semibold hover:underline" href="#">Terms of Service</a> and{' '}
              <a className="text-rf-cyan font-semibold hover:underline" href="#">Privacy Policy</a>.
            </p>
          </footer>
        </div>
      </motion.main>
    </div>
  );
}
