import { NextResponse } from "next/server";
import { getMeetingStore } from "../../route";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await context.params;
    const body = await request.json();

    const nickname =
      typeof body?.nickname === "string" ? body.nickname.trim() : "";
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (!nickname) {
      return NextResponse.json(
        { message: "닉네임을 입력해주세요." },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { message: "비밀번호를 입력해주세요." },
        { status: 400 },
      );
    }

    const meetings = getMeetingStore();
    const meeting = meetings.get(roomId);

    if (!meeting) {
      return NextResponse.json(
        { message: "해당 모임을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const existingParticipant = meeting.participants.find(
      (participant) =>
        participant.nickname.toLowerCase() === nickname.toLowerCase(),
    );

    if (existingParticipant) {
      if (existingParticipant.password !== password) {
        return NextResponse.json(
          {
            message:
              "이미 사용 중인 닉네임입니다. 비밀번호가 올바르지 않습니다.",
          },
          { status: 401 },
        );
      }

      return NextResponse.json(
        {
          participantId: existingParticipant.participantId,
          nickname: existingParticipant.nickname,
          joinedAt: existingParticipant.joinedAt,
          isNewParticipant: false,
        },
        { status: 200 },
      );
    }

    const newParticipant = {
      participantId: crypto.randomUUID(),
      nickname,
      password,
      joinedAt: new Date().toISOString(),
    };

    meeting.participants.push(newParticipant);

    return NextResponse.json(
      {
        participantId: newParticipant.participantId,
        nickname: newParticipant.nickname,
        joinedAt: newParticipant.joinedAt,
        isNewParticipant: true,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "참여자 정보를 처리하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
