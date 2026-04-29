import { isUserRequest } from "@/domain/user/userRequest";
import groupService from "@/service/group";
import userService from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    const group = await groupService.findByCode(code);
    const users = await userService.findByGroup(group);

    return NextResponse.json({ users })

}


export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const body = await req.json();
    const { code } = await params;
    const userRequest = { ...body, groupCode: code }
    if (!isUserRequest(userRequest)) {
        return NextResponse.json({}, { status: 400 })
    }
    const group = await groupService.findByCode(code);
    const result = await userService.save(userRequest, group)


    return NextResponse.json(result);
}