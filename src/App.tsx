import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSettingsStore } from './stores/settingsStore';
import { useEffect } from 'react';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import Sidebar from './components/layout/Sidebar';

// Pages
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import AttendanceList from './pages/AttendanceList';
import AttendanceDetail from './pages/AttendanceDetail';
import AssignmentList from './pages/AssignmentList';
import GradeList from './pages/GradeList';
import GradeDetail from './pages/GradeDetail';
import CgpaPlanner from './pages/CgpaPlanner';
import ExamCountdown from './pages/ExamCountdown';
import StudyTimer from './pages/StudyTimer';
import Settings from './pages/Settings';
import ManageClasses from './pages/ManageClasses';
import MorePage from './pages/MorePage';

function AppLayout() {
  return (
    <div className="min-h-screen bg-rf-base">
      <Sidebar />
      <div className="md:ml-60">
        <TopBar />
        <main className="app-container pt-16 pb-24 md:pb-8 px-4 min-h-screen">
          <Outlet />
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
  useEffect(() => {
    // Force user to authenticate per session (when website is opened/closed)
    if (!sessionStorage.getItem('scholify_session_active')) {
      sessionStorage.setItem('scholify_session_active', 'true');
      useSettingsStore.setState({ onboardingCompleted: false });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Onboarding — standalone page, no layout */}
        <Route path="/onboarding" element={<Onboarding />} />

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
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
