import { User } from "@/domain/user/user";
import { NextRequest } from "next/server";

export default function getUser(request: NextRequest) {
    const cookieSets = request.cookies;
    if (cookieSets.has("id") && cookieSets.has("name") && cookieSets.has("password") && cookieSets.has("groupcode")) {
        return {
            id: Number(cookieSets.get("id")?.value),
            name: cookieSets.get("name")?.value,
            password: cookieSets.get("password")?.value,
            groupCode: cookieSets.get('groupCode')?.value
        } as User
    }
    return undefined
}