import { getGroupByCode, type GroupResponse } from "./groupApi";
import {
  addPlaceToMeeting,
  clearFinalPlace,
  getMeetingByRoomId,
  removePlaceFromMeeting,
  setFinalPlace,
  toggleVoteForPlace,
  type MeetingRecord,
} from "../meetingStorage";

export type { MeetingRecord } from "../meetingStorage";

type LocalActionResult =
  | ReturnType<typeof addPlaceToMeeting>
  | ReturnType<typeof clearFinalPlace>
  | ReturnType<typeof removePlaceFromMeeting>
  | ReturnType<typeof setFinalPlace>
  | ReturnType<typeof toggleVoteForPlace>;

type AddCandidatePlacePayload = {
  groupCode: string;
  userId: string;
  name: string;
  lat: number | null;
  lng: number | null;
};

type PlaceActionPayload = {
  groupCode: string;
  userId: string;
  placeId: string;
};

type ClearFinalCandidatePlacePayload = {
  groupCode: string;
  userId: string;
};

function createMeetingRecordFromGroup(
  group: GroupResponse,
  localMeeting: MeetingRecord | null,
): MeetingRecord {
  const fallbackMeeting: MeetingRecord = {
    roomId: group.code,
    title: group.name,
    joinCode: group.code,
    deadlineAt: group.deadlineAt ?? "",
    createdAt: new Date().toISOString(),
    participants: [],
    places: [],
    finalPlaceId: null,
    hostParticipantId: null,
    hostNickname: null,
  };

  const baseMeeting = localMeeting ?? fallbackMeeting;

  return {
    ...baseMeeting,
    roomId: group.code,
    title: group.name,
    joinCode: group.code,
    deadlineAt: group.deadlineAt ?? baseMeeting.deadlineAt ?? "",
  };
}

export async function getMeetingByCode(
  groupCode: string,
): Promise<MeetingRecord | null> {
  const group = await getGroupByCode(groupCode);

  if (!group) {
    return null;
  }

  const localMeeting = getMeetingByRoomId(groupCode);

  return createMeetingRecordFromGroup(group, localMeeting);
}

export async function addCandidatePlace(
  payload: AddCandidatePlacePayload,
): Promise<LocalActionResult> {
  return addPlaceToMeeting({
    roomId: payload.groupCode,
    participantId: payload.userId,
    name: payload.name,
    lat: payload.lat,
    lng: payload.lng,
  });
}

export async function toggleCandidatePlaceVote(
  payload: PlaceActionPayload,
): Promise<LocalActionResult> {
  return toggleVoteForPlace({
    roomId: payload.groupCode,
    participantId: payload.userId,
    placeId: payload.placeId,
  });
}

export async function removeCandidatePlace(
  payload: PlaceActionPayload,
): Promise<LocalActionResult> {
  return removePlaceFromMeeting({
    roomId: payload.groupCode,
    participantId: payload.userId,
    placeId: payload.placeId,
  });
}

export async function setFinalCandidatePlace(
  payload: PlaceActionPayload,
): Promise<LocalActionResult> {
  return setFinalPlace({
    roomId: payload.groupCode,
    participantId: payload.userId,
    placeId: payload.placeId,
  });
}

export async function clearFinalCandidatePlace(
  payload: ClearFinalCandidatePlacePayload,
): Promise<LocalActionResult> {
  return clearFinalPlace({
    roomId: payload.groupCode,
    participantId: payload.userId,
  });
}