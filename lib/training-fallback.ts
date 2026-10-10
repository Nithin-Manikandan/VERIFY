import type {ScamType,TrainingFlag,TrainingMessage} from './types';

type Scenario={message:string;flags:[string,string][];pressure:[string,string];overt:[string,string]};
const scenarios:Record<ScamType,Scenario>={
  package:{
    message:'FedEx: The apartment number for parcel 7812 9043 1180 could not be confirmed. Please review the delivery note at https://fedex.com.delivery-review.example/781290431180. A small handling charge may apply if the address changes.',
    flags:[['fedex.com.delivery-review.example','The real domain is delivery-review.example, not fedex.com.'],['A small handling charge may apply','The message introduces a payment after a delivery problem.']],
    pressure:['We can hold the parcel only until this evening.','The sender adds a deadline to prompt a quick decision.'],
    overt:['Do not use the FedEx app for this request.','The message discourages an independent check.']
  },
  bank:{
    message:'Chase Fraud: We declined a $184.20 purchase at Oak Street Market. Reply NO if this was not you. A specialist will call and ask you to read the six-digit code from the next security text to reverse it.',
    flags:[['read the six-digit code','A fraud caller should not ask for a one-time security code.'],['A specialist will call','The conversation moves to an unverified incoming call.']],
    pressure:['Please respond before the charge posts tonight.','The sender creates a time limit around the charge.'],
    overt:['Do not call the number on your card.','The message blocks a trusted route to the bank.']
  },
  romance:{
    message:'I found a flight for next weekend. My card is frozen while I travel, but I can repay you Monday. Could you send $420 for the booking through Zelle? I feel embarrassed asking, so keep this between us.',
    flags:[['send $420 for the booking through Zelle','A new romantic contact requests an immediate transfer.'],['keep this between us','Secrecy isolates the recipient from advice.']],
    pressure:['The fare disappears tonight.','A deadline pushes a quick transfer.'],
    overt:['Please do not check with anyone else.','The sender directly discourages verification.']
  },
  grandparent:{
    message:'Voicemail: “Grandma, it is me. My phone broke after a minor accident. The tow company needs $680 before I can leave. Send it to my friend by Zelle and I will call you back. Do not call my usual number; it is out of service.”',
    flags:[['Send it to my friend by Zelle','The requested payment goes to a third party.'],['Do not call my usual number','The caller blocks a known callback route.']],
    pressure:['They close in an hour.','The caller adds urgency.'],
    overt:['Please do not tell anyone in the family yet.','The caller demands secrecy.']
  },
  'tech-support':{
    message:'Support chat: We noticed a sign-in issue while synchronizing your laptop. To check the account safely, open the remote support app and share the session code shown on your screen. I can walk you through it.',
    flags:[['open the remote support app','The sender asks for remote device access.'],['share the session code','The code may grant control of the device.']],
    pressure:['This support session expires shortly.','The sender adds an artificial deadline.'],
    overt:['Do not contact the manufacturer directly.','The sender discourages independent support.']
  },
  job:{
    message:'Recruiter: Your paid trial for the remote review role is ready. The first few tasks are free. To unlock the next batch and withdraw your earnings, add a $75 refundable balance to the work portal.',
    flags:[['add a $75 refundable balance','The worker must pay money to continue.'],['withdraw your earnings','The sender uses already-earned money as leverage.']],
    pressure:['The next batch is reserved for you only today.','The sender adds scarcity and urgency.'],
    overt:['Do not ask the company HR team about this portal.','The sender blocks normal employer verification.']
  },
  crypto:{
    message:'Wallet security: A device requested access to your account. Review it in the recovery portal at https://wallet-support.example/check. The portal will ask for your recovery phrase to verify that you own the wallet.',
    flags:[['wallet-support.example','The link is not a verified wallet-app route.'],['ask for your recovery phrase','A recovery phrase gives full control of the wallet.']],
    pressure:['The request will be approved automatically this evening.','A deadline pressures the user to act.'],
    overt:['Do not open your wallet app until the review is complete.','The sender blocks an independent check.']
  },
  prize:{
    message:'Prize desk: Your entry was selected for a travel voucher. Before we release the itinerary, we need a $49 processing payment and a photo of your ID for the passenger record.',
    flags:[['$49 processing payment','An unexpected prize requires an advance fee.'],['a photo of your ID','The sender requests sensitive identity information.']],
    pressure:['Your selection expires at 5 PM.','A deadline pushes quick compliance.'],
    overt:['Keep the claim private until the payment clears.','Secrecy is used to prevent outside advice.']
  },
  government:{
    message:'State toll office: An unpaid $6.32 toll remains on vehicle record 4812. Review it at https://toll-record.example/4812 before an administrative fee is added. This text serves as your final notice.',
    flags:[['toll-record.example','The payment route is not verified as an official toll agency.'],['administrative fee is added','The message uses a penalty to pressure payment.']],
    pressure:['The fee is added tomorrow morning.','The sender adds a near deadline.'],
    overt:['Do not visit the state toll website.','The sender discourages independent verification.']
  },
  other:{
    message:'Billing desk: Your annual device plan renewed for $399. If this was not your purchase, call our refund team at +1 (202) 555-0148. The agent may ask you to install a screen-sharing app to locate the transaction.',
    flags:[['call our refund team','The “refund” route moves the user to an unverified number.'],['install a screen-sharing app','The sender asks for access to the device.']],
    pressure:['Refund requests close this evening.','A deadline pushes a quick callback.'],
    overt:['Do not contact your card issuer first.','The sender blocks a trusted payment channel.']
  }
};

export function fallbackTraining(type:ScamType,difficulty:'easy'|'medium'|'hard'):TrainingMessage & {source:'practice'}{
  const scenario=scenarios[type];
  const extra=difficulty==='hard'?[]:difficulty==='medium'?[scenario.pressure]:[scenario.pressure,scenario.overt];
  const message=[scenario.message,...extra.map(([phrase])=>phrase)].join(' ');
  const redFlags:TrainingFlag[]=[...scenario.flags,...extra].map(([text,explanation])=>{const startIndex=message.indexOf(text);return {text,explanation,severity:'high',startIndex,endIndex:startIndex+text.length}});
  return {id:crypto.randomUUID(),type,difficulty,message,redFlags,source:'practice'};
}
