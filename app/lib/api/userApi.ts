export type UserResponse = {
  id: number;
  name: string;
  groupCode: string;
};

export type EnterGroupRequest = {
  groupCode: string;
  name: string;
  password: string;
};

export async function enterGroup(
  payload: EnterGroupRequest,
): Promise<UserResponse> {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(payload.groupCode)}/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name,
        password: payload.password,
      }),
    },
  );

  if (response.status === 400) {
    throw new Error("닉네임과 비밀번호를 확인해주세요.");
  }

  if (response.status === 404) {
    throw new Error("존재하지 않는 모임입니다.");
  }

  if (!response.ok) {
    throw new Error("입장 처리 중 문제가 발생했습니다.");
  }

  return response.json();
}

export async function getUsersByGroupCode(
  groupCode: string,
): Promise<UserResponse[]> {
  const response = await fetch(
    `/api/groups/${encodeURIComponent(groupCode)}/users`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error("참여자 목록을 불러오지 못했습니다.");
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data as UserResponse[];
  }

  if (Array.isArray(data.users)) {
    return data.users as UserResponse[];
  }

  return [];
}
