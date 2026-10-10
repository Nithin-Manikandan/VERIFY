export type ExampleScenario={label:string;channel:string;cue:string;kind:'scam'|'control';text:string};

// All people, identifiers, and domains here are fictional. .example is a reserved domain.
export const examples:ExampleScenario[]=[
  {
    label:'Delivery preference',channel:'SMS · PACKAGE',cue:'The brand name hides inside a longer domain',kind:'scam',
    text:'USPS: We tried to deliver parcel 9400 1000 0000 1234 5678 90 today, but the unit number could not be confirmed. Update your delivery preference by 6 PM to avoid a return to sender: https://usps.com.delivery-preferences.example/track/9400100000001234567890\nReply STOP to opt out.'
  },
  {
    label:'Fraud follow-up',channel:'SMS · BANK',cue:'A plausible alert turns into a code request',kind:'scam',
    text:'Chase Fraud: Did you authorize a $286.40 purchase at Green Market today? Reply YES or NO.\n\nYou: NO\n\nChase Fraud: Thanks. A specialist will call shortly. When the security text arrives, read the six-digit code to the specialist so we can stop the charge.'
  },
  {
    label:'Family emergency',channel:'VOICEMAIL · VOICE CLONE',cue:'Familiar voice, unfamiliar payment route',kind:'scam',
    text:'Voicemail transcript: “Mom, it’s Alex. I’m okay, but I was in a crash and my phone screen is broken. I borrowed someone’s phone. They need the towing deposit before they release the car. Can you Zelle $780 to my roommate tonight? Please don’t call my old number; it won’t work. I’ll explain when I get home.”'
  },
  {
    label:'Remote recruiter',channel:'CHAT · JOB',cue:'A real-sounding job becomes a deposit',kind:'scam',
    text:'Maya, Recruiting: Hi Alex — we saw your application for the remote product review role. The team liked your profile. Are you free to start the paid trial tomorrow?\n\nYou: Yes, what does the trial involve?\n\nMaya, Recruiting: You’ll rate products in our portal. The first tasks are covered, then you add a $60 refundable balance to unlock the higher-paying batch. We pay out after the batch is complete.'
  },
  {
    label:'Unpaid toll',channel:'SMS · TOLL',cue:'Small balance, large threatened fee',kind:'scam',
    text:'NY toll notice: The $6.32 toll for plate ending 4812 did not process. A $25 administrative fee will be added tomorrow. Review the notice and payment options at https://ny-tolls.billing-case.example/notice/4812. If already paid, disregard.'
  },
  {
    label:'Subscription invoice',channel:'EMAIL · REFUND',cue:'The “refund” number is the trap',kind:'scam',
    text:'From: Billing Team <billing@receipt-center.example>\nSubject: Your annual protection plan receipt\n\nYour payment of $399.00 for a device protection plan has been processed. If you did not authorize this renewal, call the billing desk at +1 (202) 555-0148 within 24 hours to reverse the charge. Do not reply to this email.'
  },
  {
    label:'Routine delivery',channel:'CONTROL · PACKAGE',cue:'No payment or urgent action',kind:'control',
    text:'USPS Informed Delivery: Your package with tracking number 9400 1000 0000 1234 5678 90 is out for delivery today. You can check tracking in the USPS app. No action is required.'
  },
  {
    label:'Statement ready',channel:'CONTROL · BANK',cue:'A useful false-positive check',kind:'control',
    text:'Chase: Your monthly statement is available. Open the Chase app or type chase.com into your browser to view it. This message does not ask for a reply, payment, or security code.'
  }
];
