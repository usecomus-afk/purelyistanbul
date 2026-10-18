import { POST as handleRequestPost } from '../requests/route';

export async function POST(req: Request) {
  return handleRequestPost(req);
}
