# PTO Tracker

Version **1.1.1**. A mobile-first, installable, offline-capable PWA for tracking time off and manually reported employer PTO balances.

## Privacy

The **public GitHub repository contains application code only**, not personal PTO records. A new installation starts with no entries. Personal records remain in local browser storage on each device until manually exported or imported. **Google Drive manual backup and restore are available through OAuth; automatic sync is not implemented.** Export JSON backups regularly, particularly before clearing site data or switching devices.

## Deployment

GitHub → repository **Settings → Pages → Build and deployment → Deploy from a branch → main → /(root) → Save**. Expected published URL: https://markz68.github.io/PTO-Tracker/ after Pages deploys.

## Features

- Exact decimal PTO balances saved as text, with history and dates; the app does not calculate accrual or deduct recorded time off from balances.
- Upcoming and past entries with category, approval/taken/worked statuses, notes, and company-holiday indicator.
- Monday to Friday, 8-hour default schedule; 1–8 whole hours per workday; weekends excluded and specific weekdays may be excluded.
- No automatic holiday weekday observance; employer-recognized holidays and requested PTO are distinct.
- JSON export/import using a visible native file picker, and CSV export from top-right Settings.
- Private 2026 starting data is supplied separately as a JSON backup, never committed to GitHub.

## Changelog

- v1.1.1: Fix missing Google Drive controls in Settings that prevented app startup and hid local data. Existing localStorage data is unchanged.

- v1.1.1: Add Google Drive OAuth sign-in and private manual backup/restore using the Drive appDataFolder scope. Keep manual JSON backups.\n\n- v1.1.1: Keep restore button always clickable and read the native file input directly on tap, regardless of whether selection status updates.\n\n- v1.1.1: Add explicit Restore selected backup button, file selection confirmation, and disabled state until a file is chosen.\n\n- v1.1.1: Replace hidden programmatically triggered JSON restore picker with visible native file selection control for Android/Windows compatibility.\n\n## Known limitations and roadmap

- Google Drive uses private appDataFolder backups with explicit overwrite confirmations. Automatic merge/sync is not implemented; do not overwrite Drive with stale device data. Requires Google Drive API enabled in the Google Cloud project.
- Annual holiday screenshot, pasted text and PDF import are planned, not implemented.
- Per-date partial-hour overrides within multi-day ranges and configurable workweeks are planned.
- Imported backup **replaces** local records after confirmation. No automatic conflict merge.
- Past entries appear in History by date but retain their status; an unapproved request is not automatically considered taken.

## Test checklist

1. Enable Pages and open the published URL on Windows and Android.
2. Import the private 2026 backup via Settings → Restore JSON backup.
3. Confirm the imported balance, as-of date, and entry count match the private backup.
4. Check Ireland June 10–19, 2026: eight weekdays, 64 hours.
5. Verify Saturday holiday alone counts zero hours and July 3, 2026 counts eight.
6. Edit/add/approve PTO, including a 1-hour day; ensure employer balance does not change.
7. Export JSON and CSV; confirm data survives a refresh.
8. Install the PWA and verify offline launch.

For updates, bump the displayed version and service-worker CACHE together. Keep all backup/restore functions under Settings.
