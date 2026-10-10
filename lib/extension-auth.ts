import {env} from 'cloudflare:workers';

export function extensionDb(){if(!env.DB)throw new Error('Account storage is unavailable.');return env.DB}
export async function sha256(value:string){const bytes=new TextEncoder().encode(value);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function randomCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const bytes=crypto.getRandomValues(new Uint8Array(12));return [...bytes].map(byte=>alphabet[byte%alphabet.length]).join('')}
export function randomToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return Boolean(origin&&origin===new URL(request.url).origin)}
export async function deviceForRequest(request:Request){
  const token=request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if(!token)return null;
  const hash=await sha256(token);
  return extensionDb().prepare('SELECT id,user_id,label FROM extension_devices WHERE token_hash = ? AND revoked_at IS NULL').bind(hash).first<{id:string;user_id:string;label:string}>();
}
