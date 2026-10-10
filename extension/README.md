# VERIFY Gmail Guard

Chrome Manifest V3 extension for Gmail. Load this folder with **chrome://extensions → Developer mode → Load unpacked**. Pair it from the VERIFY account page.

## What it does

- Checks visible Gmail inbox previews locally and badges previews with warning signals.
- Pauses high-risk opened emails and risky links. The user can continue after a second explicit choice.
- When paired, syncs only flagged sender, subject, score, and reasons to the account dashboard. The popup can turn dashboard sync off.
- Cloud analysis of opened email text is separate and off by default.

The extension uses no Gmail API permission or OAuth client. Chrome must have Gmail open for preview checks. For a personal demo while Gmail is closed, see the separate [Apps Script background sync kit](../integrations/apps-script/README.md), which requires the account owner's Google authorization.

The local risk score is a heuristic, not a fraud verdict. Always verify a concerning message through a trusted app or site opened separately.
