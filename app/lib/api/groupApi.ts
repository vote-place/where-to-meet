export type GroupResponse = {
  name: string;
  code: string;
  deadlineAt?: string | null;
};

export type CreateGroupRequest = {
  name: string;
};

export async function createGroup(
  payload: CreateGroupRequest,
): Promise<GroupResponse> {
  const response = await fetch("/api/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 400) {
    throw new Error("모임 이름을 확인해주세요.");
  }

  if (!response.ok) {
    throw new Error("모임 생성에 실패했습니다.");
  }

  const data = (await response.json()) as GroupResponse;

  if (!data.code) {
    throw new Error("서버 응답에 참여 코드가 없습니다.");
  }

  return data;
}

export async function getGroupByCode(
  code: string,
): Promise<GroupResponse | null> {
  const response = await fetch(`/api/groups?code=${encodeURIComponent(code)}`, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("모임 정보를 불러오지 못했습니다.");
  }

  return response.json();
}
