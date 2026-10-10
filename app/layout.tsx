import type { Metadata } from 'next';
import { Header, Footer } from '../components/Shell';
import './globals.css';
export const metadata: Metadata={title:'VERIFY | Evidence before action',description:'Investigate suspicious messages, learn the red flags, and take the next safe step. AI-assisted scam assessment for everyone.',icons:{icon:'/favicon.svg'},openGraph:{title:'VERIFY | Evidence before action',description:'An AI-assisted scam investigator for real life.',images:['/og.png']}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><div className="site-shell"><Header/>{children}<Footer/></div></body></html>}
