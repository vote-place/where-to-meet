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
  hostParticipantId: string | null;
  hostNickname: string | null;
};

const STORAGE_KEY = "where-to-meet:meetings";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredMeetings(): MeetingRecord[] {
  if (!isBrowser()) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredMeetings(meetings: MeetingRecord[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

export function createMeetingRecord(input: {
  title: string;
  deadlineAt: string;
}) {
  const meetings = getStoredMeetings();

  const roomId = crypto.randomUUID();
  const joinCode = `WTM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  const newMeeting: MeetingRecord = {
    roomId,
    joinCode,
    title: input.title,
    deadlineAt: input.deadlineAt,
    createdAt,
    participants: [],
    places: [],
    finalPlaceId: null,
    hostParticipantId: null,
    hostNickname: null,
  };

  saveStoredMeetings([...meetings, newMeeting]);

  return newMeeting;
}

export function getMeetingByRoomId(roomId: string) {
  return (
    getStoredMeetings().find((meeting) => meeting.roomId === roomId) ?? null
  );
}

export function getMeetingByJoinCode(joinCode: string) {
  return (
    getStoredMeetings().find(
      (meeting) => meeting.joinCode.toUpperCase() === joinCode.toUpperCase(),
    ) ?? null
  );
}

export function upsertParticipant(params: {
  roomId: string;
  nickname: string;
  password: string;
}) {
  const meetings = getStoredMeetings();
  const meetingIndex = meetings.findIndex(
    (meeting) => meeting.roomId === params.roomId,
  );

  if (meetingIndex === -1) {
    return { ok: false as const, message: "해당 모임을 찾을 수 없습니다." };
  }

  const meeting = meetings[meetingIndex];
  const trimmedNickname = params.nickname.trim();
  const trimmedPassword = params.password.trim();

  if (!trimmedNickname) {
    return { ok: false as const, message: "닉네임을 입력해주세요." };
  }

  if (!trimmedPassword) {
    return { ok: false as const, message: "비밀번호를 입력해주세요." };
  }

  const existingParticipant = meeting.participants.find(
    (participant) =>
      participant.nickname.toLowerCase() === trimmedNickname.toLowerCase(),
  );

  if (existingParticipant) {
    if (existingParticipant.password !== trimmedPassword) {
      return {
        ok: false as const,
        message: "이미 사용 중인 닉네임입니다. 비밀번호가 올바르지 않습니다.",
      };
    }

    return {
      ok: true as const,
      participant: existingParticipant,
      isNewParticipant: false,
    };
  }

  const newParticipant: ParticipantRecord = {
    participantId: crypto.randomUUID(),
    nickname: trimmedNickname,
    password: trimmedPassword,
    joinedAt: new Date().toISOString(),
  };

  const isFirstParticipant = meeting.participants.length === 0;

  const updatedMeeting: MeetingRecord = {
    ...meeting,
    participants: [...meeting.participants, newParticipant],
    hostParticipantId: isFirstParticipant
      ? newParticipant.participantId
      : meeting.hostParticipantId,
    hostNickname: isFirstParticipant
      ? newParticipant.nickname
      : meeting.hostNickname,
  };

  const nextMeetings = [...meetings];
  nextMeetings[meetingIndex] = updatedMeeting;
  saveStoredMeetings(nextMeetings);

  return {
    ok: true as const,
    participant: newParticipant,
    isNewParticipant: true,
  };
}

export function addPlaceToMeeting(params: {
  roomId: string;
  participantId: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
}) {
  const meetings = getStoredMeetings();
  const meetingIndex = meetings.findIndex(
    (meeting) => meeting.roomId === params.roomId,
  );

  if (meetingIndex === -1) {
    return { ok: false as const, message: "해당 모임을 찾을 수 없습니다." };
  }

  const meeting = meetings[meetingIndex];
  const trimmedName = params.name.trim();

  if (meeting.finalPlaceId) {
    return {
      ok: false as const,
      message: "최종 결정 후에는 장소를 추가할 수 없습니다.",
    };
  }

  if (!trimmedName) {
    return { ok: false as const, message: "장소 이름을 입력해주세요." };
  }

  const participant = meeting.participants.find(
    (item) => item.participantId === params.participantId,
  );

  if (!participant) {
    return { ok: false as const, message: "유효한 참여자가 아닙니다." };
  }

  const isDuplicate = meeting.places.some(
    (place) => place.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (isDuplicate) {
    return { ok: false as const, message: "이미 후보에 있는 장소입니다." };
  }

  const newPlace: PlaceRecord = {
    placeId: crypto.randomUUID(),
    name: trimmedName,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
    createdByParticipantId: participant.participantId,
    createdByNickname: participant.nickname,
    voteParticipantIds: [],
    createdAt: new Date().toISOString(),
  };

  const updatedMeeting: MeetingRecord = {
    ...meeting,
    places: [...meeting.places, newPlace],
  };

  const nextMeetings = [...meetings];
  nextMeetings[meetingIndex] = updatedMeeting;
  saveStoredMeetings(nextMeetings);

  return {
    ok: true as const,
    place: newPlace,
  };
}

export function removePlaceFromMeeting(params: {
  roomId: string;
  participantId: string;
  placeId: string;
}) {
  const meetings = getStoredMeetings();
  const meetingIndex = meetings.findIndex(
    (meeting) => meeting.roomId === params.roomId,
  );

  if (meetingIndex === -1) {
    return { ok: false as const, message: "해당 모임을 찾을 수 없습니다." };
  }

  const meeting = meetings[meetingIndex];

  if (meeting.finalPlaceId) {
    return {
      ok: false as const,
      message: "최종 결정 후에는 장소를 삭제할 수 없습니다.",
    };
  }

  const place = meeting.places.find((item) => item.placeId === params.placeId);

  if (!place) {
    return { ok: false as const, message: "삭제할 장소를 찾을 수 없습니다." };
  }

  if (place.createdByParticipantId !== params.participantId) {
    return {
      ok: false as const,
      message: "추가한 사람만 장소를 삭제할 수 있습니다.",
    };
  }

  const updatedMeeting: MeetingRecord = {
    ...meeting,
    places: meeting.places.filter((item) => item.placeId !== params.placeId),
  };

  const nextMeetings = [...meetings];
  nextMeetings[meetingIndex] = updatedMeeting;
  saveStoredMeetings(nextMeetings);

  return { ok: true as const };
}

export function toggleVoteForPlace(params: {
  roomId: string;
  participantId: string;
  placeId: string;
}) {
  const meetings = getStoredMeetings();
  const meetingIndex = meetings.findIndex(
    (meeting) => meeting.roomId === params.roomId,
  );

  if (meetingIndex === -1) {
    return { ok: false as const, message: "해당 모임을 찾을 수 없습니다." };
  }

  const meeting = meetings[meetingIndex];

  if (meeting.finalPlaceId) {
    return {
      ok: false as const,
      message: "최종 결정 후에는 투표할 수 없습니다.",
    };
  }

  const participant = meeting.participants.find(
    (item) => item.participantId === params.participantId,
  );

  if (!participant) {
    return { ok: false as const, message: "유효한 참여자가 아닙니다." };
  }

  const placeIndex = meeting.places.findIndex(
    (place) => place.placeId === params.placeId,
  );

  if (placeIndex === -1) {
    return { ok: false as const, message: "투표할 장소를 찾을 수 없습니다." };
  }

  const targetPlace = meeting.places[placeIndex];
  const hasVoted = targetPlace.voteParticipantIds.includes(
    params.participantId,
  );

  const updatedPlace: PlaceRecord = {
    ...targetPlace,
    voteParticipantIds: hasVoted
      ? targetPlace.voteParticipantIds.filter(
          (id) => id !== params.participantId,
        )
      : [...targetPlace.voteParticipantIds, params.participantId],
  };

  const updatedPlaces = [...meeting.places];
  updatedPlaces[placeIndex] = updatedPlace;

  const updatedMeeting: MeetingRecord = {
    ...meeting,
    places: updatedPlaces,
  };

  const nextMeetings = [...meetings];
  nextMeetings[meetingIndex] = updatedMeeting;
  saveStoredMeetings(nextMeetings);

  return {
    ok: true as const,
    place: updatedPlace,
    voted: !hasVoted,
  };
}

export function setFinalPlace(params: {
  roomId: string;
  participantId: string;
  placeId: string;
}) {
  const meetings = getStoredMeetings();
  const meetingIndex = meetings.findIndex(
    (meeting) => meeting.roomId === params.roomId,
  );

  if (meetingIndex === -1) {
    return { ok: false as const, message: "해당 모임을 찾을 수 없습니다." };
  }

  const meeting = meetings[meetingIndex];

  if (meeting.hostParticipantId !== params.participantId) {
    return {
      ok: false as const,
      message: "호스트만 최종 장소를 결정할 수 있습니다.",
    };
  }

  const exists = meeting.places.some(
    (place) => place.placeId === params.placeId,
  );

  if (!exists) {
    return {
      ok: false as const,
      message: "최종 결정할 장소를 찾을 수 없습니다.",
    };
  }

  const updatedMeeting: MeetingRecord = {
    ...meeting,
    finalPlaceId: params.placeId,
  };

  const nextMeetings = [...meetings];
  nextMeetings[meetingIndex] = updatedMeeting;
  saveStoredMeetings(nextMeetings);

  return {
    ok: true as const,
    finalPlaceId: params.placeId,
  };
}

export function clearFinalPlace(params: {
  roomId: string;
  participantId: string;
}) {
  const meetings = getStoredMeetings();
  const meetingIndex = meetings.findIndex(
    (meeting) => meeting.roomId === params.roomId,
  );

  if (meetingIndex === -1) {
    return { ok: false as const, message: "해당 모임을 찾을 수 없습니다." };
  }

  const meeting = meetings[meetingIndex];

  if (meeting.hostParticipantId !== params.participantId) {
    return {
      ok: false as const,
      message: "호스트만 최종 장소를 해제할 수 있습니다.",
    };
  }

  const updatedMeeting: MeetingRecord = {
    ...meeting,
    finalPlaceId: null,
  };

  const nextMeetings = [...meetings];
  nextMeetings[meetingIndex] = updatedMeeting;
  saveStoredMeetings(nextMeetings);

  return { ok: true as const };
}
