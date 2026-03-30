# Scholify — Antigravity Build Prompt

## What You Are Building
Build a **responsive web application** called **Scholify** — a smart academic companion for university students. This is a single-page web app (SPA) that runs in the browser. It helps students track attendance, manage assignments, calculate grades, and plan their CGPA — all in one place.

The Stitch-designed screens in `/screens/` are the **exact layout and component reference**. Recreate every screen faithfully as a web page. The screens were designed at mobile width — on desktop, center the content in a `max-width: 430px` container to preserve the design integrity, as if the phone screen is displayed in the browser. Add a subtle outer glow or border around this container on desktop so it feels intentional, not broken.

---

## Visual Style: Retro-Futuristic
**Preserve every component, layout, and spacing exactly as designed in the Stitch screens.** Apply the following retro-futuristic theme — this is a color/texture/glow layer, not a structural change.

### Retro-Futuristic Design Rules
- **Color palette:** Replace light `#F8F9FA` backgrounds with:
  - Base: `#0A0A1A`
  - Surface/sections: `#0F0F2E`
  - Elevated cards: `#151530`
  - Primary blue (keep): `#005BC0`
  - Neon cyan accent: `#00D4FF` (glows, highlights, active states)
- **Typography:** Keep Manrope (headlines) + Inter (body). Add `Space Mono` from Google Fonts for all numeric data — attendance %, grades, countdown days, GPA values. Numbers should feel like terminal readouts.
- **Borders & glow:** Cards get `1px solid rgba(0, 212, 255, 0.2)`. Active/hovered elements: `box-shadow: 0 0 12px rgba(0, 212, 255, 0.3)`.
- **Glassmorphism:** Top navbar uses `background: rgba(10, 10, 26, 0.85)` + `backdrop-filter: blur(16px)`.
- **Background texture:** Dot-grid on base surfaces — `radial-gradient(circle, rgba(0,212,255,0.06) 1px, transparent 1px)` at `background-size: 24px 24px`, opacity 4%.
- **Status colors (neon):** Safe `#00FF88`, Warning `#FFB800`, Danger `#FF3B5C`.
- **Animations:** Scan-line flicker on route transitions (CSS keyframes, <300ms). Progress rings + counters animate from 0 on mount.
- **Buttons:** Pill-shaped as in design, primary CTAs get `border: 1px solid #00D4FF; box-shadow: 0 0 16px rgba(0,212,255,0.25)` instead of flat gradient.

---

## Tech Stack (Web)
- **Framework:** React + Vite + TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (token config is already in every `/screens/*.html` file — copy the `<script id="tailwind-config">` block)
- **State:** Zustand with `persist` middleware → `localStorage` (no backend needed)
- **Charts:** Recharts
- **Calendar:** react-day-picker
- **Notifications:** Web Notifications API + `setTimeout` scheduling
- **Animations:** Framer Motion (page transitions) + CSS keyframes
- **Forms:** react-hook-form
- **Icons:** Material Symbols (Google Fonts CDN — already in all Stitch screens)
- **Fonts:** Manrope + Inter + Space Mono (Google Fonts)

---

## Screen Inventory
All screens are in `/screens/`. Use `.html` files as the exact layout + component reference. Use `/assets/screenshots/` as visual target.

| File | Route | Nav Item |
|------|-------|----------|
| `screens/onboarding.html` | `/onboarding` | Entry (first launch only) |
| `screens/home.html` | `/` | Home |
| `screens/attendance_list.html` | `/attendance` | Attendance |
| `screens/attendance_detail.html` | `/attendance/:courseId` | (drill-down) |
| `screens/assignment_list.html` | `/assignments` | Assignments |

---

## Screens Still to Build
Build these matching the exact component patterns from the Stitch screens, retro-futuristic theme applied:

1. **Grade List** (`/grades`) — Course cards with current letter grade + grade point. Same card pattern as `attendance_list.html`.
2. **Grade Detail** (`/grades/:courseId`) — Component breakdown table (UPES scheme below). Live current grade display. What-if sliders for pending components. Grade target table showing minimum needed in each pending component to hit each grade band.
3. **CGPA Planner** (`/cgpa`) — Semester history list, current semester projection, target CGPA input, simulation panel.
4. **Exam Countdown** (`/exams`) — Countdown cards sorted by proximity (days/hours). Pin exams to dashboard. Add exam button.
5. **Study Timer** (`/study`) — Course selector, Pomodoro (25/45/60 min), focus mode (full-screen minimal), weekly study hours bar chart.
6. **Settings** (`/settings`) — University profile, notification toggle, quiet hours, grading scheme editor (UPES pre-loaded), JSON data export.
7. **Add Assignment** (modal) — Title, course picker, due date picker, priority (High/Medium/Low), notes.
8. **Add Course** (modal) — Name, schedule days + time, semester start date, classes held so far, attended so far.

---

## Web Navigation
**Mobile (≤768px):** Bottom navigation bar — 5 tabs, same layout as Stitch bottom nav.
**Desktop (>768px):** Left sidebar (240px, collapsible) with the same 5 nav items.

Tabs:
1. Home (`/`)
2. Attendance (`/attendance`)
3. Grades (`/grades`)
4. Assignments (`/assignments`)
5. More — links to `/exams`, `/study`, `/cgpa`, `/settings`

FAB (bottom-right, fixed) on Home, Attendance, and Assignments pages.

---

## Folder Structure
```
scholify/
├── public/
│   └── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # Router + layout wrapper
│   ├── pages/
│   │   ├── Onboarding.tsx
│   │   ├── Home.tsx
│   │   ├── AttendanceList.tsx
│   │   ├── AttendanceDetail.tsx
│   │   ├── AssignmentList.tsx
│   │   ├── GradeList.tsx
│   │   ├── GradeDetail.tsx
│   │   ├── CgpaPlanner.tsx
│   │   ├── ExamCountdown.tsx
│   │   ├── StudyTimer.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx         # Mobile bottom tabs
│   │   │   ├── Sidebar.tsx           # Desktop left nav
│   │   │   └── TopBar.tsx
│   │   ├── ui/                       # Button, Card, Chip, Input, Modal, FAB, Badge
│   │   ├── attendance/               # AttendanceRing, CourseCard, CalendarView
│   │   ├── grades/                   # GradeCard, ComponentRow, WhatIfSlider, TargetTable
│   │   ├── assignments/              # AssignmentCard, DueDateBadge
│   │   └── home/                     # HealthRing, TodaySchedule, ExamPin
│   ├── stores/
│   │   ├── coursesStore.ts
│   │   ├── attendanceStore.ts
│   │   ├── gradesStore.ts
│   │   ├── assignmentsStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/
│   │   ├── useAttendanceCalc.ts
│   │   ├── useGradeCalc.ts
│   │   └── useNotifications.ts
│   ├── utils/
│   │   ├── gradeUtils.ts
│   │   ├── attendanceUtils.ts
│   │   └── dateUtils.ts
│   └── constants/
│       ├── theme.ts                  # Retro-futuristic color tokens
│       ├── gradingSchemes.ts         # UPES 10-pt scale pre-loaded
│       └── typography.ts
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Tailwind Config Setup
Copy the entire token set from the `<script id="tailwind-config">` block in any `/screens/*.html` file. Then add these retro-futuristic tokens to `theme.extend.colors`:
```js
"rf-base":    "#0A0A1A",
"rf-surface": "#0F0F2E",
"rf-card":    "#151530",
"rf-cyan":    "#00D4FF",
"rf-green":   "#00FF88",
"rf-amber":   "#FFB800",
"rf-red":     "#FF3B5C",
```

---

## Grading System — UPES 10-Point Scale (Pre-load as Default)
| Grade | Description | Points |
|-------|-------------|--------|
| O     | Outstanding | 10.0   |
| A+    | Excellent   | 9.0    |
| A     | Very Good   | 8.0    |
| B+    | Good        | 7.0    |
| B     | Above Average | 6.0  |
| C+    | Average     | 5.0    |
| C     | Pass        | 4.0    |
| F     | Fail        | 0      |
| Ab    | Absent/Fail | 0      |

### UPES Examination Scheme (Default Template)
- IA: 50% — Quiz 1 (15%), Quiz 2 (15%), Class Test 1 (15%), Class Test 2 (15%), Assignment 1 (20%), Assignment 2 (20%)
- Mid Semester: 20%
- End Semester: 30%

---

## Core Feature Logic

### Attendance
- Minimum threshold: 75% (configurable per course)
- Classes can skip: `Math.floor(attended + future - 0.75 * (attended + absent + future))`
- Colors: ≥80% → `#00FF88`, 75–79% → `#FFB800`, <75% → `#FF3B5C`
- Mid-semester init: allow entering classes held + attended so far when creating a course
- Future projection: schedule days × remaining weeks − holidays

### Assignment Manager
- Sort ascending by due date (soonest first)
- Days remaining: <2 red, 2–5 amber, >5 green
- Click to expand / mark complete → moves to archive tab
- Overdue section pinned at top with badge

### Grade Calculator
- Weighted score: `(marks_obtained / max_marks) × component_weightage`
- Current grade = sum of entered weighted scores (pending = 0)
- What-if: drag slider for pending components → live projected grade updates
- Grade target table: for each grade band, back-calculate minimum needed in each pending component

### Course Health Score
- `(attendance_score × 0.4) + (grade_score × 0.4) + (assignment_score × 0.2)`
- attendance_score: 100 if ≥80%, 50 if 75–79%, 0 if <75%
- grade_score: grade_points × 10
- assignment_score: `Math.max(0, 100 − pending_count × 20)`
- Ring color: ≥75 green, 50–74 amber, <50 red. Red courses float to top of dashboard.

### Web Notifications
- Request permission during onboarding via `Notification.requestPermission()`
- Schedule with `setTimeout`, persist timestamps in `localStorage`
- Attendance alert: fires at class time when attendance <80%
- Assignment reminders: 3 days before, 1 day before, morning of due date
- Weekly digest: Sunday 7 PM

### Data Persistence
- All stores persist to `localStorage` via Zustand `persist` middleware
- No login, no backend for MVP
- Settings page: export all data as JSON, import JSON to restore

---

## Priority Build Order
1. Vite + React + Tailwind + Zustand + Router setup
2. Apply retro-futuristic theme globally (CSS vars + Tailwind tokens)
3. Onboarding page + Add Course modal
4. Home dashboard (health rings, today's schedule, pinned exams)
5. Attendance list + detail + mark present/absent
6. Assignment feed + Add Assignment modal
7. Grade list + detail + what-if simulator
8. Web notification scheduling
9. CGPA planner, exam countdown, study timer
10. Settings + JSON export/import

---

## Reference Files Included in This Bundle
- `/screens/*.html` — Stitch screen exports — exact component + layout reference
- `/assets/screenshots/*.png` — Visual target per screen
- `/docs/DESIGN_SYSTEM.md` — Stitch design system spec (Academic Curator)
- `/docs/PRD.html` — Full product requirements document
