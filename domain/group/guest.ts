export interface GuestResponse {
    guestId: string;
}

export function isGuestResponse(obj: unknown): obj is GuestResponse {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof (obj as any).guestId === "string"
    );
}
