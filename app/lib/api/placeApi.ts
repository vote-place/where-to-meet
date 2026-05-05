export type PlaceResponse = {
  id: number | string;
  groupCode: string;
  name: string;
  lat: number | null;
  lng: number | null;
  createdByUserId?: number | string;
  voteUserIds?: Array<number | string>;
  voteCount?: number;
  createdAt?: string;
};

export type CreatePlaceRequest = {
  groupCode: string;
  name: string;
  lat: number | null;
  lng: number | null;
};

export type PlaceVoteResponse = {
  placeId: number | string;
  voted: boolean;
  voteCount: number;
  voteUserIds?: Array<number | string>;
};

export type FinalPlaceResponse = {
  finalPlaceId: number | string | null;
};

function getGroupBasePath(groupCode: string) {
  return `/api/groups/${encodeURIComponent(groupCode)}`;
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error("API 요청 처리 중 문제가 발생했습니다.");
  }

  return response.json() as Promise<T>;
}

export async function getPlacesByGroupCode(
  groupCode: string,
): Promise<PlaceResponse[]> {
  const response = await fetch(`${getGroupBasePath(groupCode)}/places`, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return [];
  }

  const data = await parseJsonOrThrow<PlaceResponse[] | { places: PlaceResponse[] }>(
    response,
  );

  if (Array.isArray(data)) {
    return data;
  }

  return data.places;
}

export async function createPlace(
  payload: CreatePlaceRequest,
): Promise<PlaceResponse> {
  const response = await fetch(`${getGroupBasePath(payload.groupCode)}/places`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name,
      lat: payload.lat,
      lng: payload.lng,
    }),
  });

  if (response.status === 400) {
    throw new Error("장소 이름 또는 위치 정보를 확인해주세요.");
  }

  if (response.status === 401) {
    throw new Error("입장한 사용자만 후보 장소를 추가할 수 있습니다.");
  }

  return parseJsonOrThrow<PlaceResponse>(response);
}

export async function deletePlace(
  groupCode: string,
  placeId: string | number,
): Promise<void> {
  const response = await fetch(
    `${getGroupBasePath(groupCode)}/places/${encodeURIComponent(String(placeId))}`,
    {
      method: "DELETE",
    },
  );

  if (response.status === 401) {
    throw new Error("입장한 사용자만 후보 장소를 삭제할 수 있습니다.");
  }

  if (response.status === 403) {
    throw new Error("본인이 추가한 장소만 삭제할 수 있습니다.");
  }

  if (!response.ok) {
    throw new Error("후보 장소 삭제 중 문제가 발생했습니다.");
  }
}

export async function togglePlaceVote(
  groupCode: string,
  placeId: string | number,
): Promise<PlaceVoteResponse> {
  const response = await fetch(
    `${getGroupBasePath(groupCode)}/places/${encodeURIComponent(
      String(placeId),
    )}/votes`,
    {
      method: "POST",
    },
  );

  if (response.status === 401) {
    throw new Error("입장한 사용자만 투표할 수 있습니다.");
  }

  if (response.status === 404) {
    throw new Error("존재하지 않는 후보 장소입니다.");
  }

  return parseJsonOrThrow<PlaceVoteResponse>(response);
}

export async function setFinalPlaceById(
  groupCode: string,
  placeId: string | number,
): Promise<FinalPlaceResponse> {
  const response = await fetch(`${getGroupBasePath(groupCode)}/final-place`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ placeId }),
  });

  if (response.status === 401) {
    throw new Error("입장한 사용자만 최종 장소를 결정할 수 있습니다.");
  }

  if (response.status === 403) {
    throw new Error("호스트만 최종 장소를 결정할 수 있습니다.");
  }

  return parseJsonOrThrow<FinalPlaceResponse>(response);
}

export async function clearFinalPlaceByGroupCode(
  groupCode: string,
): Promise<FinalPlaceResponse> {
  const response = await fetch(`${getGroupBasePath(groupCode)}/final-place`, {
    method: "DELETE",
  });

  if (response.status === 401) {
    throw new Error("입장한 사용자만 최종 장소 결정을 해제할 수 있습니다.");
  }

  if (response.status === 403) {
    throw new Error("호스트만 최종 장소 결정을 해제할 수 있습니다.");
  }

  return parseJsonOrThrow<FinalPlaceResponse>(response);
}
