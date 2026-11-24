# PTO Tracker

PTO Tracker keeps a history of planned and past time off, annual holidays, and employer-reported PTO balances.

**Live app** · https://markz68.github.io/PTO-Tracker/

**Version** · v1.3.5

## Features

- Record exact decimal PTO balances and their dates. Time-off entries never deduct from the employer-reported balance.
- Track upcoming and past requests with category, status, notes, and quick status changes.
- Count scheduled weekdays using 1–8 hours per day. Weekends are excluded automatically, and selected dates can be skipped.
- Preview, edit and generate annual holiday templates without creating duplicate holidays.
- Follow your device theme or choose Light or Dark in Settings.

## Install and use

Open the live app in your browser. On Android, use **Install app** or **Add to Home screen** when available. On Windows, use the browser’s install option or open the site directly. After the initial online load, local tracking and JSON backup and restore work offline.

Use **Update** to enter the balance from your employer and **+ Add PTO** to record time off. Open the top-right gear for **Annual Holidays**, **Backup & Restore**, **About**, and **Theme**. Select **Done** to close Settings.

## Data and privacy

Records and preferences are stored in this browser. New installations start empty. **Settings → About** links to [More Apps](https://markz68.github.io/PTO-Tracker/about.html), [Privacy](https://markz68.github.io/PTO-Tracker/privacy.html), and [Terms](https://markz68.github.io/PTO-Tracker/terms.html).

## Backup and restore

Open **Settings → Backup & Restore**.

- **Export Backup File** saves entries, balances, and holiday templates in `pto-tracker-backup-YYYY-MM-DD.json`. Choose a file under **Restore from Backup File**, then review and confirm the replacement. Existing JSON backups still work under their original filenames.
- **Export CSV** saves time-off entries for Excel or other spreadsheet apps. Use JSON for a full, restorable backup.
- **Google Drive** is optional and uses the app’s private Drive folder. Automatic sync runs while connected. Use **Sync Now** to check immediately, **Back Up to Google Drive** to send the local copy, and **Restore from Google Drive** to retrieve it. The app pauses sync if both copies differ and the baseline cannot resolve which one changed. An empty device cannot overwrite nonempty Drive records.
- Google authorization is session-based. Reconnect after a browser restart or Google session expiry.

## Release notes

### v1.3.5

- Matched the shared Settings gear, theme choices, Done button, and About page.
- Combined JSON, CSV, and Google Drive controls in one Backup & Restore page.
- Added in-app backup and restore previews, Drive status and last successful activity, and protection against empty-device overwrites.
- Preserved the existing holiday workflow, PTO record format, and Drive backup location.

## v1.3.2

Holiday template saving now displays persistent inline success confirmation with year and selected holiday count. Editing the template marks it unsaved and disables generation until saved again.

## v1.3.3

Moved Google Drive sync status from the employer-reported balance card to the application header under the version number. The existing sync status element ID and behavior are unchanged. No changes to PTO records, balance calculations, or Drive sync logic.

## v1.3.4

- Settings now has four submenus: Google Drive Sync, Annual Holidays, Backup & Export, and About. Submenus have sticky close and back controls.
- Upcoming and History date badges always show the year, including both years for cross-year ranges.
- New generated holidays default to Planned (8 PTO hours on scheduled weekdays), and Worked / Not off records zero. Existing legacy Recognized holiday entries display as Planned and count recorded weekday hours without rewriting stored data. Weekend holidays remain zero weekday PTO hours. Holiday generation skips dates already present as Holiday entries.
- Employer-reported balance remains manual and is never deducted from entries. All existing backup and sync controls remain available.

## Earlier releases

- v1.3.1: Show full weekday beside each generated holiday date and highlight Saturdays and Sundays in the annual template preview. Unchecking retains the holiday in the template but excludes it from generated entries.


- v1.3.1: Editable year-specific Reid Health holiday templates, including optional MLK Day, custom fixed dates, calculated Easter and weekday holidays. Preview and duplicate checking. Generated entries are Recognized (0 PTO hours), never assumed days off. Holiday templates included in Google Drive sync and JSON backups.


- v1.3.1: Add a quick status dropdown to every upcoming/history PTO entry, independent of the full edit button. Status updates save locally and trigger connected Drive synchronization.

- v1.3.1: For new PTO requests, changing Start date automatically sets End date to the same day. Existing entries retain their independently editable end dates.

- v1.3.1: Mirror synchronization progress and outcome in the Settings status field, instead of leaving it stuck on Checking for changes.

- v1.3.1: Automatic sync on connect, local changes, return to app, online recovery and periodic checks. Sync Now in Settings and visible status. A device without a matching sync baseline pauses if its local data differs from Drive. Concurrent edits pause sync instead of overwriting either copy. OAuth connection is session-only; refresh requires reconnecting.

- v1.3.1: Fix missing Google Drive controls in Settings that prevented app startup and hid local data. Existing localStorage data is unchanged.

- v1.3.1: Add Google Drive OAuth sign-in and private manual backup/restore using the Drive appDataFolder scope. Keep manual JSON backups.

- v1.3.1: Keep restore button always clickable and read the native file input directly on tap, regardless of whether selection status updates.

- v1.3.1: Add explicit Restore selected backup button, file selection confirmation, and disabled state until a file is chosen.

- v1.3.1: Replace hidden programmatically triggered JSON restore picker with visible native file selection control for Android/Windows compatibility.

## Known limitations and roadmap

- Google Drive uses private appDataFolder backups with explicit overwrite confirmations. Automatic sync requires an active OAuth session; conflicting changes require manual reconciliation. Do not overwrite Drive with stale device data. Requires Google Drive API enabled in the Google Cloud project.
- Annual holiday screenshot, pasted text and PDF import are planned, not implemented.
- Per-date partial-hour overrides within multi-day ranges and configurable workweeks are planned.
- Imported backup **replaces** local records after confirmation. No automatic conflict merge.
- Past entries appear in History by date but retain their status; an unapproved request is not automatically considered taken.
