# VERIFY: 90-second judge walkthrough

**One-line setup:** “A scam detector gives you a warning. VERIFY gives you the evidence and a safer decision.”

| Time | Show | Say |
| --- | --- | --- |
| 0–15 s | [Homepage](https://verify-scam-investigator.randomdude15.chatgpt.site/) | “A message says your package is delayed. The question is whether to trust it. VERIFY separates the claim from evidence and uncertainty.” |
| 15–40 s | [Guided inbox case](https://verify-scam-investigator.randomdude15.chatgpt.site/demo) | Open the fictional USPS email. Show the visible sender mismatch, the misleading URL, and the fee deadline. Open its evidence ledger. |
| 40–55 s | Continue from the warning | “A risky click is paused. The user can go back or explicitly continue. We explain the reasons before asking for a decision.” |
| 55–75 s | [Campaign Radar](https://verify-scam-investigator.randomdude15.chatgpt.site/radar) | Trace the exact hostname shared by the fictional email, text, and QR. Point out that demo samples do not enter live community counts. |
| 75–90 s | Trusted exit / response plan | “We still cannot prove the underlying delivery claim. VERIFY points to the official site opened independently, then offers a response plan if the user already acted.” |

## If a judge asks

**“Is this just another scam detector?”**
“Detection is one part. VERIFY shows the source evidence, what it cannot know, and a safer next action before the user clicks or pays.”

**“Can you really verify a bank account?”**
“No private bank account is connected in this demo. The product labels that claim unverified. A USPS Tracking adapter is built, but live results require USPS credentials.”

**“Are those campaign numbers real?”**
“The starter case is fictional. Real hostname counts come only from signed-in users who choose to report; we label them unverified submissions and never fabricate activity.”

**“What happens when the model is down?”**
“Investigation falls back to clearly labeled rules-based findings. Training falls back to a fictional built-in exercise. The response checklist remains available.”

## Technical highlights to mention if there is time

- The model sees the submitted message as **untrusted evidence**. Quoted phrases are checked against the input before they appear as quotes.
- Default link inspection is passive. Deep redirect tracing is opt-in and rejects private-address destinations.
- Gmail Guard checks visible previews locally and pauses suspicious emails and links. Cloud analysis of opened email text is off by default.
