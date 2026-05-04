import { isEnterRequest } from "@/domain/participant/participantRequest";
import { requireGuestId } from "@/lib/auth/guest";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    let body: unknown;

    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    if (!isEnterRequest(body)) {
        return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
        );
    }

    try {
        const guestId = await requireGuestId();
        const { groupId, meetingId } = body;

        return NextResponse.json({
            ok: true,
            participant: {
                guestId,
                groupId,
                meetingId,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "UNAUTHORIZED_GUEST") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
