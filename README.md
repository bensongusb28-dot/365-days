# 365 Days 📸

One photo and one journal entry, every day. It's a personal photo journal that runs on your iPhone like an app. It's built with plain HTML, CSS and JavaScript, so there's nothing to install and no build step.

## What's in the folder

```
365-days/
├── index.html            ← the page (Home Screen tags live here)
├── manifest.webmanifest  ← app name, icon, colors for "Add to Home Screen"
├── sw.js                 ← service worker: makes the app load offline
├── css/styles.css        ← all the design, including dark mode
├── js/app.js             ← screens, streaks, reminders, backup, passcode
├── js/db.js              ← saves entries in IndexedDB (on-device database)
├── js/zip.js             ← builds/reads backup .zip files
├── js/video.js           ← turns a year of photos into a video
└── icons/                ← app icons
```

---

## 1. Try it on your computer (2 minutes)

The app needs a web server (opening `index.html` directly won't work, because service workers require one).

- **Mac:** open Terminal, `cd` into the `365-days` folder, run `python3 -m http.server 8000`, then visit http://localhost:8000
- **VS Code:** install the "Live Server" extension, right-click `index.html` → *Open with Live Server*.

Tip: in Chrome, press F12 → click the phone icon to preview it at iPhone size.

## 2. Deploy it (free, about 5 minutes)

It must be served over **HTTPS** for Home Screen install and offline mode. Either option below gives you that automatically.

### Option A: Netlify Drop (easiest, no account setup needed to start)
1. Go to **https://app.netlify.com/drop**
2. Drag the whole `365-days` folder onto the page.
3. You get a URL like `https://sunny-otter-1234.netlify.app`. Create a free account to keep it permanently, and rename the site in *Site settings*.
4. To update later: *Deploys* → drag the folder again.

### Option B: GitHub Pages
1. Create a free GitHub account and a new **public** repository called `365-days`.
2. *Add file → Upload files* → drag in everything inside the folder → *Commit*.
3. *Settings → Pages* → Source: *Deploy from a branch* → `main` / root → Save.
4. After a minute your app is at `https://YOUR-NAME.github.io/365-days/`.

> **Is it OK that the code is public?** Yes. Only the *app* is online. Your photos and journal never leave your phone. Nobody visiting the URL can see your entries.

**When you change the code:** open `sw.js` and bump `VERSION` (e.g. `v1.0.1`) so iPhones pick up the update. Then close and reopen the app.

## 3. Install and test on your iPhone

1. Open your URL in **Safari** (not Chrome, which can't install apps on iOS).
2. Tap **Share** (□↑) → **Add to Home Screen** → **Add**.
3. Open **365 Days** from your Home Screen. It opens full-screen with no browser bars.
4. Test checklist:
   - [ ] Tap *Add today's photo* → take a photo → it appears, and the streak shows 1
   - [ ] Type a journal entry, swipe the app away, reopen → the text is still there
   - [ ] Calendar → tap an earlier day → add a photo → the streak grows
   - [ ] Timeline scrolls through your entries
   - [ ] More → Theme → Dark
   - [ ] More → *Set up reminder*
   - [ ] More → *Back up* → *Save to Files* → iCloud Drive
   - [ ] Airplane mode → the app still opens and works
   - [ ] With a few photos, More → *Create video* (use "Fast" to test)

**Important:** always use the Home Screen icon, not a Safari tab. iOS can clear website data that hasn't been visited for 7 days, but Home Screen apps are exempt. A Safari tab and the Home Screen app also keep **separate** data.

---

## 4. Keeping your data safe

**Where your data lives:** in IndexedDB, a database inside the app on your iPhone. There's no server, no account and no upload. The app also asks iOS to mark its storage as *persistent* so it isn't cleaned up automatically.

**Privacy:**
- Turn on **More → Passcode lock** to require a 4-digit code when the app opens or returns after a minute. The code is stored only as a salted hash. Note that this is a privacy screen, not encryption. Your iPhone's own passcode and Face ID are what encrypt everything on the device.
- Don't open the app in Private Browsing. Nothing can be saved there.

**Backups (the most important part):** because everything lives on one phone, a lost phone or a deleted app means a lost journal, *unless you back up*.
- **More → Back up / export everything** creates one `.zip` containing every photo (`photos/2026-11-14.jpg`), a readable `Journal.md`, and `journal.json`.
- Tap **Save to Files → iCloud Drive**. iCloud Drive then keeps it off your phone and syncs it everywhere.
- The app reminds you on the Today screen if a week passes without a backup.
- **Restore:** More → *Restore from a backup* → pick the zip. This also moves your journal to a new phone.
- ⚠️ **Deleting the Home Screen icon deletes its data.** Back up first.

Your export is plain JPEGs plus Markdown, so it opens anywhere and you're never locked in.

---

## 5. How features work (and honest limits)

| Feature | How it works |
|---|---|
| Daily photo | Resized to 2048px JPEG (~400–700 KB) plus a small square thumbnail for the calendar |
| Journal | Unlimited text that autosaves as you type |
| Streak | Counts consecutive days **with a photo**. Today doesn't break it until the day is over |
| Calendar | A month grid of thumbnails. A dot means there's a journal entry. Swipe to change months |
| Edit past days | Tap any past day in Calendar or Timeline |
| Timeline | Newest first, grouped by month, with full photos loading as you scroll |
| Year video | Plays the year on a canvas with a slow zoom and crossfades, recorded as **MP4** (720×1280). 365 photos at 0.5s ≈ 3 minutes. Keep the app open while it records, then tap *Save video* → *Save Video* to put it in Photos |
| Reminders | A repeating calendar event with an alert, or steps for the Reminders app (see below) |
| Offline | Works with no internet after the first visit |

**About reminders:** web apps on iPhone can only send push notifications through a server, and this version deliberately has none. So *Set up reminder* gives you a daily calendar alert, or steps to create a repeating reminder in Apple's Reminders app. Both are reliable.

**About "automatic" backups:** a server-free app can't silently upload your photos anywhere, so v1 uses one-tap backups to iCloud Drive plus weekly nudges. True automatic cloud backup is the main upgrade below.

**Storage:** a full year is about 200–250 MB. iPhones handle that comfortably.

---

## 6. Ideas for version 2

- **Automatic cloud sync and backup:** add [Supabase](https://supabase.com) (free tier). Use email login, store photos in Storage and entries in a table, and protect them with row-level security so only you can read them. This also enables syncing across devices.
- **Real push reminders:** also via a small server (e.g. Supabase Edge Functions + Web Push). This works for Home Screen apps on iOS 16.4+.
- **Native App Store app:** wrap the same code with [Capacitor](https://capacitorjs.com) to get local notifications, iCloud and Face ID.
- **Video soundtrack:** mix in an audio track with the Web Audio API.
