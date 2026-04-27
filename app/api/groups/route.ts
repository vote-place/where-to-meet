import { isGroupRequest } from "@/domain/group/groupRequest";
import groupService from "@/service/group";
import { group } from "console";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    console.log(code)
    if (typeof code === "string") {
        const result = await groupService.findByCode(code)
        console.log(result)
        if (!result)
            return NextResponse.json({ error: "없음" }, { status: 404 });

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

