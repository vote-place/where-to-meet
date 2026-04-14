"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";

type MeetingRecord = {
  roomId: string;
  joinCode: string;
  title: string;
  deadlineAt: string;
  createdAt: string;
  participants: {
    participantId: string;
    nickname: string;
    joinedAt: string;
  }[];
};

type ParticipantSession = {
  participantId: string;
  nickname: string;
  joinedAt: string;
};

type MeetingPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

function getStorageKey(roomId: string) {
  return `where-to-meet:participant:${roomId}`;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const [roomId, setRoomId] = useState("");
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [participant, setParticipant] = useState<ParticipantSession | null>(
    null,
  );
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    params.then(({ roomId }) => {
      setRoomId(roomId);
    });
  }, [params]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    async function fetchMeeting() {
      setIsLoadingMeeting(true);

      try {
        const response = await fetch(`/api/meetings?roomId=${roomId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          setMeeting(null);
          return;
        }

        const data = await response.json();
        setMeeting(data);

        const savedParticipant = window.localStorage.getItem(
          getStorageKey(roomId),
        );

        if (savedParticipant) {
          try {
            const parsed = JSON.parse(savedParticipant) as ParticipantSession;
            setParticipant(parsed);
          } catch {
            window.localStorage.removeItem(getStorageKey(roomId));
          }
        }
      } finally {
        setIsLoadingMeeting(false);
      }
    }

    fetchMeeting();
  }, [roomId]);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roomId) {
      return;
    }

    setAuthError("");

    if (nickname.trim() === "") {
      setAuthError("닉네임을 입력해주세요.");
      return;
    }

    if (password.trim() === "") {
      setAuthError("비밀번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/meetings/${roomId}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "참여자 인증에 실패했습니다.");
      }

      const session: ParticipantSession = {
        participantId: data.participantId,
        nickname: data.nickname,
        joinedAt: data.joinedAt,
      };

      window.localStorage.setItem(
        getStorageKey(roomId),
        JSON.stringify(session),
      );
      setParticipant(session);
      setPassword("");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    if (!roomId) {
      return;
    }

    window.localStorage.removeItem(getStorageKey(roomId));
    setParticipant(null);
    setNickname("");
    setPassword("");
    setAuthError("");
  }

  return (
    <div className="app create-page">
      <Header />

      <main className="create-main">
        <section className="create-shell">
          {isLoadingMeeting ? (
            <div className="create-form-card">
              <div className="create-page-heading">
                <p className="create-page-eyebrow">LOADING</p>
                <h1>방 정보를 불러오는 중입니다</h1>
              </div>
            </div>
          ) : !meeting ? (
            <div className="create-form-card">
              <div className="create-page-heading">
                <p className="create-page-eyebrow">ROOM NOT FOUND</p>
                <h1>모임 정보를 찾을 수 없습니다</h1>
                <p className="create-page-description">
                  방이 삭제되었거나, 유효하지 않은 접근일 수 있습니다.
                </p>
              </div>
            </div>
          ) : !participant ? (
            <div className="create-form-card create-form-simple">
              <div className="create-page-heading">
                <p className="create-page-eyebrow">ENTER MEETING</p>
                <h1>{meeting.title}</h1>
                <p className="create-page-description">
                  이 방에서 사용할 닉네임과 비밀번호를 입력해주세요. 같은
                  닉네임으로 다시 접속할 때도 같은 비밀번호가 필요합니다.
                </p>
              </div>

              <form className="create-form-simple" onSubmit={handleJoin}>
                <div className="create-form-row">
                  <div className="create-form-group">
                    <label htmlFor="nickname">닉네임</label>
                    <input
                      id="nickname"
                      type="text"
                      placeholder="예: 주인님"
                      value={nickname}
                      onChange={(event) => {
                        setNickname(event.target.value);
                        if (authError) {
                          setAuthError("");
                        }
                      }}
                    />
                  </div>

                  <div className="create-form-group">
                    <label htmlFor="password">비밀번호</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="방에서 사용할 비밀번호"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (authError) {
                          setAuthError("");
                        }
                      }}
                    />
                  </div>
                </div>

                {authError && <p className="create-error-text">{authError}</p>}

                <button
                  type="submit"
                  className="create-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "입장 중..." : "이 닉네임으로 입장하기"}
                </button>
              </form>
            </div>
          ) : (
            <div className="create-form-card create-form-simple">
              <div className="create-page-heading">
                <p className="create-page-eyebrow">MEETING ROOM</p>
                <h1>{meeting.title}</h1>
                <p className="create-page-description">
                  이제 이 안에서 장소를 추가하고, 투표하고, 최종 장소를 정하게
                  됩니다.
                </p>
              </div>

              <div className="create-inline-note">
                현재 참여자: <strong>{participant.nickname}</strong>
              </div>

              <div className="create-submit-preview">
                <p className="create-submit-preview-title">기본 방 정보</p>
                <pre>
                  {JSON.stringify(
                    {
                      roomId: meeting.roomId,
                      joinCode: meeting.joinCode,
                      deadlineAt: meeting.deadlineAt,
                      createdAt: meeting.createdAt,
                      participantNickname: participant.nickname,
                      participantId: participant.participantId,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>

              <button
                type="button"
                className="create-submit-button"
                onClick={handleLogout}
              >
                이 방에서 로그아웃
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
