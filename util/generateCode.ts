import { randomBytes } from "crypto";

export function generateCode(): string {
    return randomBytes(22).toString("base64url");
}