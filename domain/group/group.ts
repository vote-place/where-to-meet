export interface Group {
    code: string
    name: string,

};

export function isGroup(obj: unknown): obj is Group {
    return (
        typeof obj === "object" &&
        obj !== null &&
        typeof (obj as any).name === "string" &&
        typeof (obj as any).code === "string"
    );
}