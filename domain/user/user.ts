import { Group, isGroup } from "../group/group";

export interface User {
    id: number,
    groupCode: string
    name: string,
    password: string
}

export function isUser(obj: unknown): obj is User {
    return (typeof obj == "object" &&
        obj != null &&
        typeof (obj as any).id == "number" &&
        typeof (obj as any).groupCode == "string" &&
        typeof (obj as any).name == 'string' &&
        typeof (obj as any).password == 'string'
    )
}