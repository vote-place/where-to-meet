// 쿠키 정책 모아둔 모듈

import "server-only";

import { cookies } from "next/headers";

const GUEST_COOKIE_NAME = "guestId";

export const guestCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

function isValidGuestId(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function getGuestId() {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value;

  return isValidGuestId(guestId) ? guestId : null;
}

export async function requireGuestId() {
  const guestId = await getGuestId();

  if (!guestId) {
    throw new Error("UNAUTHORIZED_GUEST");
  }

  return guestId;
}

export async function setGuestIdCookie(guestId: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE_NAME, guestId, guestCookieOptions);
}
