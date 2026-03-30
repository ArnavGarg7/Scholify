import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/settingsStore';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
  const {
    studentName, university, notificationsEnabled, quietHoursStart, quietHoursEnd,
    setProfile, setNotifications, setQuietHours, exportData, importData,
  } = useSettingsStore();

  const [name, setName] = useState(studentName);
  const [uni, setUni] = useState(university);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = () => {
    setProfile(name, uni);
    setSaved(true);
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
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importData(reader.result as string);
    };
    reader.readAsText(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-4 pb-4 space-y-4"
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

      {/* App Info */}
      <div className="text-center py-4">
        <p className="text-gray-600 text-xs">Scholify v1.0.0</p>
        <p className="text-gray-700 text-[10px]">Smart Academic Companion</p>
      </div>
    </motion.div>
  );
}
