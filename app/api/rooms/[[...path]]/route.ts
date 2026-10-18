import { env } from 'cloudflare:workers';
import {handleRooms} from '../../../../server/rooms.mjs';
export const dynamic='force-dynamic';
export function GET(request:Request){return handleRooms(request,env.DB);}
export function POST(request:Request){return handleRooms(request,env.DB);}
