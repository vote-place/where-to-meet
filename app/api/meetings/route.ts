import { NextResponse } from "next/server";

export type ParticipantRecord = {
  participantId: string;
  nickname: string;
  password: string;
  joinedAt: string;
};

export type PlaceRecord = {
  placeId: string;
  name: string;
  lat: number | null;
  lng: number | null;
  createdByParticipantId: string;
  createdByNickname: string;
  voteParticipantIds: string[];
  createdAt: string;
};

export type MeetingRecord = {
  roomId: string;
  joinCode: string;
  title: string;
  deadlineAt: string;
  createdAt: string;
  participants: ParticipantRecord[];
  places: PlaceRecord[];
  finalPlaceId: string | null;
};

const meetings = new Map<string, MeetingRecord>();

function generateRoomId() {
  return crypto.randomUUID();
}

function generateJoinCode() {
  return `WTM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function getMeetingStore() {
  return meetings;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const deadlineAt =
      typeof body?.deadlineAt === "string" ? body.deadlineAt : "";

    if (!title) {
      return NextResponse.json(
        { message: "모임 이름은 반드시 입력해야 합니다." },
        { status: 400 },
      );
    }

    const deadlineDate = new Date(deadlineAt);

    if (!deadlineAt || Number.isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { message: "올바른 마감 일시를 입력해주세요." },
        { status: 400 },
      );
    }

    if (deadlineDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { message: "마감 일시는 현재 시각보다 이후여야 합니다." },
        { status: 400 },
      );
    }

    const roomId = generateRoomId();
    const joinCode = generateJoinCode();
    const createdAt = new Date().toISOString();

    const newMeeting: MeetingRecord = {
      roomId,
      joinCode,
      title,
      deadlineAt,
      createdAt,
      participants: [],
      places: [],
      finalPlaceId: null,
    };

    meetings.set(roomId, newMeeting);

    return NextResponse.json(
      {
        roomId,
        joinCode,
        createdAt,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "요청을 처리하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json(
      { message: "roomId가 필요합니다." },
      { status: 400 },
    );
  }

  const meeting = meetings.get(roomId);

  if (!meeting) {
    return NextResponse.json(
      { message: "해당 모임을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  return NextResponse.json(meeting);
}
