# VERIFY personal background sync (hackathon demo)

This optional Google Apps Script checks your Gmail inbox about every five minutes, even while Gmail and Chrome are closed. It uses the **Gmail API read-only** scope in your own Apps Script project. It does not require you to create a separate OAuth client or verify a custom domain for personal testing. Google still asks you to authorize the script, and an unverified-app warning may appear. Review the requested permissions before proceeding. The script sends only flagged sender, subject, score, and reasons to VERIFY; message bodies are analyzed in the script and are not sent to VERIFY.

## Set up

1. Sign in to VERIFY and generate a pairing code on `/account`.
2. In [script.google.com](https://script.google.com/), create a new project. Keep it private and owned by the Gmail account you want to scan.
3. Replace `Code.gs` with this package's `Code.gs`.
4. Open Project Settings, turn on **Show "appsscript.json" manifest file in editor**, then replace the manifest with this package's `appsscript.json`.
5. In the editor's **Services** panel, add **Gmail API** if it is not already present.
6. In Project Settings → Script properties, add `VERIFY_PAIRING_CODE` with your one-time VERIFY code.
7. Select `connectVerify` and click Run. Review Google's permissions. The code is exchanged once and removed from Script properties. A five-minute trigger is created and the first scan runs immediately.
8. In VERIFY's account dashboard, use Refresh to see flagged mail. To stop, run `disconnectVerify` or revoke the device from the VERIFY dashboard.

The script checks up to 60 recent inbox messages from the last two days and remembers IDs to avoid repeat scans. It cannot guarantee that every incoming email is scanned immediately; Google timer triggers and quotas apply. If the Gmail API call is unavailable, check that the Gmail API advanced service was added and the manifest was saved. This is a personal test integration, not a publicly distributed Gmail app.
