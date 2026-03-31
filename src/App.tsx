import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSettingsStore } from './stores/settingsStore';
import { useEffect, lazy, Suspense } from 'react';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import Sidebar from './components/layout/Sidebar';
import ToastContainer from './components/ui/Toast';
import { useToastStore } from './stores/toastStore';
import { pullFromFirestore, setupAutoSync } from './lib/firestore';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Lazy-loaded Pages (D3)
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Home = lazy(() => import('./pages/Home'));
const AttendanceList = lazy(() => import('./pages/AttendanceList'));
const AttendanceDetail = lazy(() => import('./pages/AttendanceDetail'));
const AssignmentList = lazy(() => import('./pages/AssignmentList'));
const GradeList = lazy(() => import('./pages/GradeList'));
const GradeDetail = lazy(() => import('./pages/GradeDetail'));
const CgpaPlanner = lazy(() => import('./pages/CgpaPlanner'));
const ExamCountdown = lazy(() => import('./pages/ExamCountdown'));
const StudyTimer = lazy(() => import('./pages/StudyTimer'));
const Settings = lazy(() => import('./pages/Settings'));
const ManageClasses = lazy(() => import('./pages/ManageClasses'));
const MorePage = lazy(() => import('./pages/MorePage'));
const AcademicCalendar = lazy(() => import('./pages/AcademicCalendar'));

// Loading Spinner
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-3 border-rf-cyan/20 border-t-rf-cyan rounded-full animate-spin" />
    </div>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-rf-base">
      <Sidebar />
      <div className="md:ml-60">
        <TopBar />
        <main className="app-container pt-16 pb-24 md:pb-8 px-4 min-h-screen">
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

function RequireOnboarding() {
  const onboardingCompleted = useSettingsStore((s) => s.onboardingCompleted);
  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  return <AppLayout />;
}

export default function App() {
  const themeMode = useSettingsStore((s) => s.themeMode);

  // Session tracking
  useEffect(() => {
    sessionStorage.setItem('scholify_session_active', 'true');
  }, []);

  // Firestore auto-sync (D1)
  useEffect(() => {
    const cleanup = setupAutoSync();
    return cleanup;
  }, []);

  // Pull from Firestore on auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const hydrated = await pullFromFirestore();
          if (hydrated) {
            useToastStore.getState().addToast('Synced data from cloud ☁️', 'info', 2500);
            // Reload to hydrate all stores from the updated localStorage
            setTimeout(() => window.location.reload(), 500);
          }
        } catch (err) {
          console.warn('Firestore pull failed:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Apply theme class
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  // Assignment notification check (C2)
  useEffect(() => {
    const checkAssignments = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const assignments = JSON.parse(localStorage.getItem('scholify-assignments') || '{"state":{"assignments":[]}}');
      const items = assignments?.state?.assignments || [];
      const now = new Date();
      items.forEach((a: any) => {
        if (a.completed) return;
        const due = new Date(a.dueDate);
        const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
          new Notification('📚 Scholify: Assignment Due Soon', {
            body: `"${a.title}" is due in ${Math.round(hoursUntilDue)} hours!`,
            icon: '/scholify-logo.png',
          });
        }
      });
    };
    const interval = setInterval(checkAssignments, 60 * 60 * 1000); // Check every hour
    checkAssignments(); // Check immediately
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Onboarding — standalone page, no layout */}
        <Route path="/onboarding" element={
          <Suspense fallback={<LoadingSpinner />}><Onboarding /></Suspense>
        } />

        {/* All other routes — wrapped in AppLayout with onboarding guard */}
        <Route element={<RequireOnboarding />}>
          <Route path="/" element={<Home />} />
          <Route path="/attendance" element={<AttendanceList />} />
          <Route path="/attendance/:courseId" element={<AttendanceDetail />} />
          <Route path="/assignments" element={<AssignmentList />} />
          <Route path="/grades" element={<GradeList />} />
          <Route path="/grades/:courseId" element={<GradeDetail />} />
          <Route path="/cgpa" element={<CgpaPlanner />} />
          <Route path="/exams" element={<ExamCountdown />} />
          <Route path="/study" element={<StudyTimer />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/classes" element={<ManageClasses />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/calendar" element={<AcademicCalendar />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
