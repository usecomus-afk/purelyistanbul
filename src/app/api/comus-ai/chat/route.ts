export {
  POST,
  COMUS_SYSTEM_INSTRUCTION,
  COMUS_SYSTEM_INSTRUCTION as COMUS_AI_SYSTEM_INSTRUCTION,
  buildComusSystemInstruction,
  fetchPropertyLiveContext,
  inferPropertyType,
  formatUnitName,
  UKOME_TAXI_RATES,
  checkTaxiFare,
  createRoomTicket,
  searchPublishedListingsTool,
  type PropertyLiveContext,
} from '@/app/api/comus/chat/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
