import {getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath} from '../chatgpt-auth';
import {AccountClient} from './AccountClient';
import {DashboardClient} from './DashboardClient';
import {ShieldCheck,Mail,MonitorSmartphone,LockKeyhole} from 'lucide-react';

export const dynamic='force-dynamic';

export default async function AccountPage(){
  const user=await getChatGPTUser();
  return <main className="container subpage account-page">
    <div className="page-heading"><div className="kicker">VERIFY ACCOUNT / 006</div><h1>Your protection, connected.</h1><p>Use your email sign-in to pair the Gmail Guard extension, manage connected browsers, and keep control of cloud analysis.</p></div>
    {!user?<div className="account-grid"><section className="panel"><div className="panel-top"><strong className="mono">CREATE OR ACCESS YOUR ACCOUNT</strong><span className="pill mono">EMAIL SIGN-IN</span></div><div className="panel-body"><div className="account-icon"><Mail size={27}/></div><h2>Start with your email.</h2><p>VERIFY uses secure ChatGPT sign-in for accounts. If you already have a ChatGPT account, use its email. If you are new, the sign-in flow lets you create one.</p><a className="primary-button" href={chatGPTSignInPath('/account')} target="_top">Continue with email <span aria-hidden="true">↗</span></a><p className="subtle-note">Your Gmail inbox is never connected by signing in alone. You choose when to install and enable the browser extension. Read our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms</a>.</p></div></section><aside className="side-stack"><div className="side-card"><div className="eyebrow mono">HOW IT WORKS</div><h3>Three clear steps.</h3><div className="mini-steps"><div className="mini-step"><b>1</b>Sign in with your email</div><div className="mini-step"><b>2</b>Install Gmail Guard in Chrome</div><div className="mini-step"><b>3</b>Pair with a short-lived code</div></div></div><div className="side-card"><div className="eyebrow mono">PRIVACY</div><p>Local warnings run in your browser. Cloud analysis is optional and only sends an opened email when you switch it on.</p></div></aside></div>:<>
      <div className="account-summary"><div className="account-avatar"><ShieldCheck size={23}/></div><div><strong>{user.displayName}</strong><span>{user.email}</span></div><a href={chatGPTSignOutPath('/account')} target="_top">Sign out</a></div>
      <DashboardClient/>
      <AccountClient/>
    </>}
    <a className="account-demo-link" href="/demo">Want to see the full warning flow without connecting Gmail? <strong>Open the interactive demo →</strong></a><div className="account-benefits"><div><MonitorSmartphone size={19}/><strong>Inbox preview checks</strong><span>Gmail Guard flags visible inbox previews while Gmail is open.</span></div><div><LockKeyhole size={19}/><strong>Reversible blocking</strong><span>High-risk messages and links pause until you explicitly continue.</span></div><div><ShieldCheck size={19}/><strong>Focused data</strong><span>Only flagged metadata is synced. No email bodies are stored in the dashboard.</span></div></div>
  </main>;
}
