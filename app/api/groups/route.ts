import { isGroupRequest } from "@/domain/participant/groupRequest";
import groupService from "@/service/group";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    if (typeof code === "string") {
        const result = await groupService.findByCode(code)
        if (!result)
            return NextResponse.json({ error: "not found" }, { status: 404 });

        return NextResponse.json(result);
    }

    return NextResponse.json({ error: "err" }, { status: 404 });
}


export async function POST(req: NextRequest) {
    const body = await req.json();
    if (!isGroupRequest(body)) {
        return NextResponse.json({}, { status: 400 })
    }

    const result = await groupService.save(body)

    return NextResponse.json(result)
}

