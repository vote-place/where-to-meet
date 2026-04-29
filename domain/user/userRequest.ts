export interface UserRequest {
    groupCode: string,
    name: string,
    password: string
}



export function isUserRequest(obj: unknown): obj is UserRequest {
    return (typeof obj == "object" &&
        obj != null &&
        typeof (obj as any).groupCode == "string" &&
        typeof (obj as any).name == 'string' &&
        typeof (obj as any).password == 'string'
    )
}