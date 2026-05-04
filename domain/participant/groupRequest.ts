export interface GroupRequest {
    name: string,

};

export function isGroupRequest(obj: unknown): obj is GroupRequest {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof (obj as any).name === "string"
    );
}