# USPS independent tracking check

VERIFY can ask the official USPS Tracking 3.2 API for a package's current status. A carrier record confirms only the tracking status. It does not authenticate an email sender, confirm that the recipient owns the package, or authorize a payment request.

## Connect the live API

1. Create a free USPS developer/business account through [USPS Getting Started](https://developers.usps.com/getting-started).
2. In the USPS Customer Onboarding Portal, create an app and copy its Consumer Key and Consumer Secret. The default USPS API product includes Tracking, according to USPS.
3. In the VERIFY Site's runtime environment settings, set `USPS_CLIENT_ID` to the Consumer Key and `USPS_CLIENT_SECRET` to the Consumer Secret. Mark both as secrets. Never put them in source files or a browser extension.
4. Redeploy the saved Site version so the new environment revision takes effect.
5. Open a real USPS investigation. The claim panel will show a tracking-number field. Enter a number from the message or one you already know. A successful check will show only the USPS status and summary.

The endpoint uses the [USPS OAuth token API](https://developers.usps.com/Oauth) and [USPS Tracking 3.2](https://developers.usps.com/trackingv3r2). It is rate limited, does not store submitted tracking numbers in VERIFY's product database, and reports unavailable or missing records as inconclusive. The adapter has mocked API tests but cannot be tested against USPS until valid credentials and a live tracking number are available.
