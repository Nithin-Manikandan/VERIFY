# VERIFY — Evidence before action

## The problem

People receive urgent messages that ask them to click, pay, or share a code. A threat warning can be useful, but a black-box score often leaves the most important question unanswered: **what evidence supports the warning, and what should the person do next?**

## What we built

VERIFY is an AI-assisted trust investigator for suspicious messages. It extracts claims and observable signals, checks link destinations, and presents an evidence ledger with three explicit parts: **what the message says, what we observed, and what remains unknown**. The app recommends a route to the organization's official site found independently of the message.

The guided demo shows an email warning and a reversible pause before a risky click. Gmail Guard adds local checks to visible Gmail previews. Campaign Radar connects exact destinations across email, text, QR codes, and call notes; opt-in community counts show real submissions without pretending that the fictional starter case is live intelligence. Training, a family safe word, and a response checklist help before and after a scam attempt.

## How it works

React and TypeScript run on OpenAI Sites with a Cloudflare Worker backend. The investigation API streams extraction, guarded URL checks, and structured NVIDIA NIM analysis. Exact-quote validation and deterministic rules keep the interface usable when AI is unavailable. D1 stores paired device records, flagged dashboard metadata, and opt-in community reports. A Chrome Manifest V3 extension performs local Gmail preview scoring and pauses suspicious actions. An optional personal Apps Script can check recent Gmail mail while Chrome is closed after the account owner authorizes read-only access.

## Real-world value

VERIFY helps a person slow down during a moment of pressure and understand a warning before acting on it. Its central design choice is to **show limits honestly**: a suspicious URL is evidence, but it does not prove an account claim false; a tracking record does not authenticate an email; and zero community reports does not mean a link is safe. The result is a more informed, user-controlled decision.

## Try it

- [Live app](https://verify-scam-investigator.randomdude15.chatgpt.site/)
- [Guided case](https://verify-scam-investigator.randomdude15.chatgpt.site/demo)
- [Campaign Radar](https://verify-scam-investigator.randomdude15.chatgpt.site/radar)
- [Source and setup](../README.md)
