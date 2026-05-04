import { getGuestId, setGuestIdCookie } from "@/lib/auth/guest";
import { generateCode } from "@/util/generateCode";
import { NextResponse } from "next/server";

export async function POST() {
    const exstingGuestId = await getGuestId();

    if (exstingGuestId) {
        return NextResponse.json({ guestId: exstingGuestId });
    }

    //새로운 guestId 생성
    const newGuestId = generateCode();
    await setGuestIdCookie(newGuestId);
    return NextResponse.json({ guestId: newGuestId }, { status: 201});
}