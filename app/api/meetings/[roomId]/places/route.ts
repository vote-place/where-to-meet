import { NextResponse } from "next/server";
import { getMeetingStore } from "../../route";

export async function POST(
  request: Request,
  context: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await context.params;
    const body = await request.json();

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const participantId =
      typeof body?.participantId === "string" ? body.participantId.trim() : "";

    const lat =
      typeof body?.lat === "number" && Number.isFinite(body.lat)
        ? body.lat
        : null;
    const lng =
      typeof body?.lng === "number" && Number.isFinite(body.lng)
        ? body.lng
        : null;

    if (!name) {
      return NextResponse.json(
        { message: "장소 이름을 입력해주세요." },
        { status: 400 },
      );
    }

    if (!participantId) {
      return NextResponse.json(
        { message: "참여자 정보가 필요합니다." },
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

    const participant = meeting.participants.find(
      (item) => item.participantId === participantId,
    );

    if (!participant) {
      return NextResponse.json(
        { message: "유효한 참여자가 아닙니다." },
        { status: 401 },
      );
    }

    const isDuplicate = meeting.places.some(
      (place) => place.name.toLowerCase() === name.toLowerCase(),
    );

    if (isDuplicate) {
      return NextResponse.json(
        { message: "이미 후보에 있는 장소입니다." },
        { status: 409 },
      );
    }

    const newPlace = {
      placeId: crypto.randomUUID(),
      name,
      lat,
      lng,
      createdByParticipantId: participant.participantId,
      createdByNickname: participant.nickname,
      voteParticipantIds: [],
      createdAt: new Date().toISOString(),
    };

    meeting.places.push(newPlace);

    return NextResponse.json(newPlace, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "장소를 추가하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
