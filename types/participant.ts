export interface EnterRequest {
    groupId: string;
    meetingId: string;
};

export function isEnterRequest(obj: unknown): obj is EnterRequest {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof (obj as any).groupId === "string" &&
        typeof (obj as any).meetingId === "string"
    );
}
