import {handle} from '@/game/server';
import {getDatabase} from '@/game/sqlite';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){return handle(request,getDatabase());}
