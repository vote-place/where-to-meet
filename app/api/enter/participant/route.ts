import { isEnterRequest } from "@/types/participant";

export async function POST(req: Request) {
    const body = await req.json();
    if (!isEnterRequest(body)) {
        return new Response("Invalid request body", { status: 400 });
    }

    const { groupId, meetingId } = body;
    // 비즈니스 로직을 관리하는 클래스를 만들자
}