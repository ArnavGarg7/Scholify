import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/settingsStore';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../stores/toastStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Settings() {
  const navigate = useNavigate();
  const {
    studentName, university, notificationsEnabled, quietHoursStart, quietHoursEnd,
    semesterStartDate, semesterEndDate, themeMode,
    setProfile, setNotifications, setQuietHours, setSemesterDates, setThemeMode,
    exportData, importData,
  } = useSettingsStore();

  const addToast = useToastStore((s) => s.addToast);
  const [name, setName] = useState(studentName);
  const [uni, setUni] = useState(university);
  const [semStart, setSemStart] = useState(semesterStartDate);
  const [semEnd, setSemEnd] = useState(semesterEndDate);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = () => {
    setProfile(name, uni);
    if (semStart && semEnd) setSemesterDates(semStart, semEnd);
    setSaved(true);
    addToast('Profile saved successfully', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholify-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Data exported successfully', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importData(reader.result as string);
      addToast('Data imported — reloading...', 'info');
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }} className="pt-4 pb-4 space-y-4"
    >
      <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">Settings</h1>

      {/* Profile */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rf-cyan text-lg">person</span>
          University Profile
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Student Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-10 px-4 text-sm text-white rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">University</label>
            <input type="text" value={uni} onChange={(e) => setUni(e.target.value)} className="w-full h-10 px-4 text-sm text-white rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Semester Start</label>
              <input type="date" value={semStart} onChange={(e) => setSemStart(e.target.value)} className="w-full h-10 px-3 text-xs text-white rounded-xl" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Semester End</label>
              <input type="date" value={semEnd} onChange={(e) => setSemEnd(e.target.value)} className="w-full h-10 px-3 text-xs text-white rounded-xl" />
            </div>
          </div>
          <button onClick={handleSaveProfile} className="rf-btn-primary px-6 py-2 rounded-full text-xs">
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Course Management */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rf-cyan text-lg">calendar_month</span>
          Academic Schedule
        </h3>
        <button
          onClick={() => navigate('/settings/classes')}
          className="w-full bg-rf-surface hover:bg-rf-surface/80 border border-rf-cyan-dim text-white p-4 rounded-xl text-left transition-colors flex items-center justify-between group"
        >
          <div>
            <p className="text-sm font-bold">Manage Classes</p>
            <p className="text-xs text-gray-500 mt-0.5">Edit room times, fix days, or remove dropped courses</p>
          </div>
          <span className="material-symbols-outlined text-gray-500 group-hover:text-rf-cyan transition-colors">chevron_right</span>
        </button>
      </div>

      {/* Appearance */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rf-cyan text-lg">palette</span>
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white">Theme Mode</p>
            <p className="text-[10px] text-gray-500">Switch between dark and light themes</p>
          </div>
          <div className="flex bg-rf-surface rounded-full border border-rf-cyan-dim overflow-hidden">
            <button
              onClick={() => setThemeMode('dark')}
              className={`px-3 py-1.5 text-[10px] font-bold transition-all ${themeMode === 'dark' ? 'bg-rf-cyan text-white' : 'text-gray-500'}`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setThemeMode('light')}
              className={`px-3 py-1.5 text-[10px] font-bold transition-all ${themeMode === 'light' ? 'bg-rf-cyan text-white' : 'text-gray-500'}`}
            >
              ☀️ Light
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rf-cyan text-lg">notifications</span>
          Notifications
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">Enable Notifications</p>
              <p className="text-[10px] text-gray-500">Attendance alerts, assignment reminders</p>
            </div>
            <button
              onClick={() => {
                if (!notificationsEnabled && 'Notification' in window) {
                  Notification.requestPermission().then((perm) => {
                    setNotifications(perm === 'granted');
                    addToast(perm === 'granted' ? 'Notifications enabled' : 'Notifications blocked by browser', perm === 'granted' ? 'success' : 'warning');
                  });
                } else {
                  setNotifications(!notificationsEnabled);
                }
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${
                notificationsEnabled ? 'bg-rf-cyan' : 'bg-rf-surface border border-rf-cyan-dim'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-all ${
                notificationsEnabled ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Quiet Hours Start</label>
              <input type="time" value={quietHoursStart} onChange={(e) => setQuietHours(e.target.value, quietHoursEnd)} className="w-full h-10 px-3 text-xs text-white rounded-xl rf-number" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Quiet Hours End</label>
              <input type="time" value={quietHoursEnd} onChange={(e) => setQuietHours(quietHoursStart, e.target.value)} className="w-full h-10 px-3 text-xs text-white rounded-xl rf-number" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rf-cyan text-lg">database</span>
          Data Management
        </h3>
        <div className="space-y-3">
          <button onClick={handleExport} className="w-full bg-rf-surface border border-rf-cyan-dim text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-rf-card transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Data as JSON
          </button>

          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="w-full bg-rf-surface border border-rf-cyan-dim text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-rf-card transition-colors">
            <span className="material-symbols-outlined text-sm">upload</span>
            Import Data from JSON
          </button>
        </div>
      </div>

      {/* Data Clear / Authenication */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rf-red text-lg">logout</span>
          Account
        </h3>
        
        <div className="flex gap-3">
          <button
            onClick={async () => {
              try {
                await signOut(auth);
                addToast('Signed out of cloud sync. Data remains locally.', 'info');
              } catch (e) {
                console.error(e);
              }
            }}
            className="flex-1 bg-rf-amber/10 border border-rf-amber/20 text-rf-amber py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 hover:bg-rf-amber/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">cloud_off</span>
            Sign Out
          </button>
          
          <button
            onClick={async () => {
              try { await signOut(auth); } catch (e) {}
              const keys = ['scholify-courses', 'scholify-attendance', 'scholify-grades', 'scholify-assignments', 'scholify-settings', 'scholify-holidays', 'scholify-notes'];
              keys.forEach(k => localStorage.removeItem(k));
              sessionStorage.removeItem('scholify_session_active');
              addToast('All data cleared', 'info');
              setTimeout(() => { window.location.href = '/onboarding'; }, 500);
            }}
            className="flex-1 bg-rf-red/10 border border-rf-red/20 text-rf-red py-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 hover:bg-rf-red/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete_forever</span>
            Clear Data
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 text-center">"Sign Out" pauses cloud sync. "Clear Data" resets the app locally.</p>
      </div>

      {/* App Info */}
      <div className="text-center py-4">
        <img src="/scholify-logo.png" alt="Scholify" className="w-10 h-10 mx-auto mb-2 rounded-lg object-contain opacity-50" />
        <p className="text-gray-600 text-xs">Scholify v2.0.0</p>
        <p className="text-gray-700 text-[10px]">Smart Academic Companion</p>
      </div>
    </motion.div>
  );
}
