import {getDatabase} from '@/game/sqlite';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{await getDatabase().prepare('SELECT 1').first();return Response.json({ok:true});}catch{return Response.json({ok:false},{status:503});}}
