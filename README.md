# Scholify — Project Bundle

## How to Use This Bundle

### For Antigravity
1. Import this zip into Antigravity
2. Open `ANTIGRAVITY_PROMPT.md` — copy the full contents and paste as your build prompt
3. Antigravity will reference `/screens/` for layout and `/assets/screenshots/` for visuals
4. Follow the priority build order at the bottom of the prompt

### What's Inside
```
scholify/
├── ANTIGRAVITY_PROMPT.md       ← Paste this into Antigravity as your prompt
├── README.md                   ← This file
├── screens/                    ← Stitch HTML exports (layout reference)
│   ├── home.html
│   ├── onboarding.html
│   ├── attendance_list.html
│   ├── attendance_detail.html
│   └── assignment_list.html
├── assets/
│   └── screenshots/            ← PNG visual targets per screen
│       ├── home.png
│       ├── onboarding.png
│       ├── attendance_list.png
│       ├── attendance_detail.png
│       └── assignment_list.png
└── docs/
    ├── DESIGN_SYSTEM.md        ← Stitch Academic Curator design spec
    └── PRD.html                ← Full product requirements document
```

### What Antigravity Will Build
A **React + Vite web app** (not a mobile app) with:
- Retro-futuristic dark theme on top of the Stitch component designs
- All 5 designed screens + 8 additional screens to build
- localStorage persistence (no backend needed)
- Web Notifications API for alerts
- Responsive: mobile bottom nav + desktop sidebar

### Screens Still Needed from Stitch (Optional)
You can design these in Stitch and add to `/screens/` before the final build:
- Grade List + Grade Detail
- CGPA Planner
- Exam Countdown
- Study Timer
- Settings
