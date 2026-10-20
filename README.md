# KSAU-HS HTMS Portal: RT Skills Laboratories

The Healthcare Technology Management Services (HTMS) portal for the Respiratory Therapy skills labs CM-01-158 and CM-01-162, College of Applied Medical Sciences (Male), Riyadh.

Live site: https://stepoverfifa-lang.github.io/contingency-log/

## What's in this repository

| File | What it holds | Edit it to… |
| --- | --- | --- |
| `index.html` | Page layout: sign-in screen, dashboard, tabs, forms and pop-up windows | change headings, buttons, form fields or layout |
| `css/styles.css` | Custom styles: animations, login background, scrollbars, print layout | adjust animations or what prints |
| `js/tailwind-config.js` | Brand colours (`ksau-50` … `ksau-950`, `gold`) and fonts | change the colour palette or fonts |
| `js/data.js` | Starting labs, equipment inventory (50 units, 38 sub-components), staff accounts, device statuses and the master administrator | change the starting data (see the note below) |
| `js/i18n.js` | Every on-screen label in English (`en`) and Arabic (`ar`) | fix wording or translations |
| `js/firebase-config.js` | Firebase project settings for cloud sync | point the portal to a different Firebase project |
| `js/logo.js` | The built-in KSAU-HS emblem drawn as SVG | adjust the fallback emblem |
| `js/app.js` | All behaviour, in numbered sections: state, cloud sync, sign-in, language switch, dashboard and inventory, tabs, forms, PDF report, QR code, Excel export | change how the portal works |

The page loads Tailwind CSS, Lucide icons, SheetJS (`xlsx-js-style`), QRCode.js, html2pdf.js and Firebase from their CDNs. There is no build step.

## Editing on GitHub

1. Open the file on github.com and click the pencil icon (**Edit this file**).
2. Make the change, then click **Commit changes**.
3. GitHub Pages republishes the site, usually within a minute or two. Refresh the live site to see it.

For changes to several files, press `.` on the repository page to open the full web editor.

## Previewing on your own computer

Because the code is now split into JavaScript modules, opening `index.html` by double-clicking won't work: browsers block module files loaded from disk. Use a small local web server instead:

- **VS Code:** install the *Live Server* extension, then right-click `index.html` and choose **Open with Live Server**.
- **Python:** run `python -m http.server 8000` in this folder, then open http://localhost:8000.

## Important: where the live data comes from

`js/data.js` is only the starting data. The first time the portal connects, it saves everything to Firebase (Cloud Firestore document `htms_portal/master_v2`). From then on, every browser loads the inventory, logs, labs and staff accounts from Firebase, and keeps a backup copy in the browser.

So, after the portal is in use:

- Change equipment, log entries, labs and staff accounts **inside the portal** (after signing in), not in `js/data.js`.
- Editing `js/data.js` only affects a fresh Firebase project, or one where that document has been deleted.

## Who can use the portal

The portal is for the skills laboratory custodian and selected faculty members only.

- **Master administrator:** Abdulrahman Mufti (badge 919670), Skills Laboratory Custodian, Respiratory Therapy Program. Username `amufti`. This is the only account that can create or remove staff accounts, and it can't be deleted. Its details are in `MASTER_ADMIN` in `js/data.js`.
- **Faculty members:** created by the master administrator under **Staff Credentials & Permissions**, with their own permissions for editing equipment, logging issues and managing labs.
- **HTMS engineer access has been removed.** Each time the portal loads, it deletes the former `admin` account and any account whose name or title mentions "Engineer", "Eng." or "HTMS". This happens in the live Firebase data, not only in `js/data.js`. To block another username, add it to `REMOVED_USERNAMES` in `js/data.js`.
- **Passwords** are stored as SHA-256 hashes, never as plain text. Older accounts with plain-text passwords are converted the first time they sign in. Everyone can change their own password with the key button in the header.
- The former HTMS engineer's contingency log entries and sign-off blocks have been removed. Log entries recorded under the badge numbers in `REMOVED_LOG_BADGES` (`js/data.js`) are deleted whenever the portal loads.

## Forgotten passwords

The sign-in screen has a **Forgot your password?** link, and the page can also be opened directly at `https://stepoverfifa-lang.github.io/contingency-log/#reset-password`.

- To reset a password, a person enters their username, their **recovery code** and a new password.
- The master administrator gets a recovery code for each new account when creating it, and can issue a new one from the account's card under **Staff Credentials & Permissions** (**Issue recovery code** / **New recovery code**). Give the code to the person privately. It's shown only once.
- Each recovery code works once. After a reset, the page shows the person a new code to keep.
- Recovery codes are stored as hashes, like passwords. The master administrator's own code works the same way.

## Device statuses

Statuses are listed in `STATUSES` in `js/data.js`: **Operational**, **Maintenance** (out for corrective repair) and **Contingency / Fault**. Calibration and preventive maintenance are handled by HTMS, so "Calibration Due" isn't tracked. Any device still marked Calibration Due is set back to Operational, and calibration log entries are removed, when the portal loads.

Serial numbers are no longer shown in the inventory, report, search or Excel export. Serial numbers already on file are kept in the saved data.

## Security notes

- Sign-in happens in the browser, and the accounts (with password hashes) are stored in the same Firebase document as the inventory. Anyone technical who opens the site can read that document, and can change it unless your Firestore security rules prevent it. For real protection, move sign-in to Firebase Authentication and restrict the Firestore rules to signed-in staff.
- The old `admin` password (`ksauhs2026`) is still visible in this repository's earlier commits, but that account is now removed automatically, so the password no longer works.
