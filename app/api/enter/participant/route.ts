import { EnterRequest } from "@/types/participant";
import { isEnterRequest } from "@/types/participant";

export async function POST(req: Request) {
    const body = await req.json();
    if (!isEnterRequest(body)) {
        return new Response("Invalid request body", { status: 400 });
    }

    const { groupId, userId, meetingId } = body;
}