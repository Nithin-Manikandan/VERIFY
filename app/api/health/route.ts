import {env} from 'cloudflare:workers';
export async function GET(){return Response.json({status:'ok',aiConfigured:Boolean(env.NVIDIA_API_KEY_1||env.NVIDIA_API_KEY_2),timestamp:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}})}
