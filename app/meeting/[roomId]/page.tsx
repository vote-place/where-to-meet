"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import Header from "../../components/Header";
import GoogleMapsProvider from "../../components/GoogleMapsProvider";
import PlaceSearchInput from "../../components/PlaceSearchInput";
import { enterGroup } from "../../lib/api/userApi";
import {
  connectSocket,
  joinGroupRealtimeRoom,
  leaveGroupRealtimeRoom,
  type GroupRealtimeEventPayload,
} from "../../lib/socket";
import {
  addCandidatePlace,
  clearFinalCandidatePlace,
  getMeetingByCode,
  removeCandidatePlace,
  setFinalCandidatePlace,
  toggleCandidatePlaceVote,
  type MeetingRecord,
} from "../../lib/api/meetingApi";

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

type LatLng = {
  lat: number;
  lng: number;
};

function isValidDateString(value: string) {
  return value.trim() !== "" && !Number.isNaN(new Date(value).getTime());
}

function getParticipantStorageKey(roomId: string) {
  return `where-to-meet:participant:${roomId}`;
}

function formatDeadline(deadlineAt: string) {
  const date = new Date(deadlineAt);

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getDeadlineStatus(deadlineAt: string) {
  const targetTime = new Date(deadlineAt).getTime();
  const diff = targetTime - Date.now();

  if (Number.isNaN(targetTime)) {
    return "마감 일시를 확인할 수 없습니다.";
  }

  if (diff <= 0) {
    return "마감 시간이 지났습니다.";
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days >= 1) {
    return `${days}일 후 마감`;
  }

  if (hours >= 1) {
    return `${hours}시간 후 마감`;
  }

  if (minutes >= 1) {
    return `${minutes}분 후 마감`;
  }

  return "곧 마감됩니다.";
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const defaultCenter = { lat: 37.4979, lng: 127.0276 };

  const [roomId, setRoomId] = useState("");
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [participant, setParticipant] = useState<ParticipantSession | null>(
    null,
  );
  const [authError, setAuthError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const [newPlaceName, setNewPlaceName] = useState("");
  const [placeError, setPlaceError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [copyMessage, setCopyMessage] = useState("");
  const [isTopSummaryExpanded, setIsTopSummaryExpanded] = useState(true);
  const [socketStatus, setSocketStatus] = useState<
    "idle" | "connecting" | "connected" | "disconnected" | "disabled"
  >("idle");
  const [realtimeMessage, setRealtimeMessage] = useState("");

  useEffect(() => {
    params.then(({ roomId }) => {
      setRoomId(roomId);
    });
  }, [params]);

  const refreshMeeting = useCallback(async (targetRoomId: string) => {
    const nextMeeting = await getMeetingByCode(targetRoomId);

    setMeeting(nextMeeting);
    return nextMeeting;
  }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let isCancelled = false;

    async function loadMeeting() {
      setIsLoadingMeeting(true);
      setAuthError("");

      try {
        await refreshMeeting(roomId);

        if (isCancelled) {
          return;
        }

        const savedParticipant = window.localStorage.getItem(
          getParticipantStorageKey(roomId),
        );

        if (savedParticipant) {
          try {
            const parsed = JSON.parse(savedParticipant) as ParticipantSession;
            setParticipant(parsed);
          } catch {
            window.localStorage.removeItem(getParticipantStorageKey(roomId));
          }
        }
      } catch {
        if (!isCancelled) {
          setMeeting(null);
          setAuthError("모임 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMeeting(false);
        }
      }
    }

    loadMeeting();

    return () => {
      isCancelled = true;
    };
  }, [roomId, refreshMeeting]);

  useEffect(() => {
    if (!roomId || !participant) {
      setSocketStatus("idle");
      return;
    }

    const socket = connectSocket();

    if (!socket) {
      setSocketStatus("disabled");
      return;
    }

    let isActive = true;

    function handleConnect() {
      if (!isActive) {
        return;
      }

      setSocketStatus("connected");
      joinGroupRealtimeRoom(roomId);
    }

    function handleDisconnect() {
      if (!isActive) {
        return;
      }

      setSocketStatus("disconnected");
    }

    async function handleGroupRealtimeUpdate(
      payload: GroupRealtimeEventPayload = {},
    ) {
      if (!isActive) {
        return;
      }

      if (payload.groupCode && payload.groupCode !== roomId) {
        return;
      }

      try {
        await refreshMeeting(roomId);
        setRealtimeMessage("실시간 변경사항을 반영했습니다.");
      } catch {
        setVoteError("실시간 변경사항을 불러오지 못했습니다.");
      }
    }

    setSocketStatus(socket.connected ? "connected" : "connecting");

    if (socket.connected) {
      joinGroupRealtimeRoom(roomId);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("meeting:updated", handleGroupRealtimeUpdate);
    socket.on("vote:updated", handleGroupRealtimeUpdate);
    socket.on("place:created", handleGroupRealtimeUpdate);
    socket.on("place:deleted", handleGroupRealtimeUpdate);
    socket.on("final-place:updated", handleGroupRealtimeUpdate);

    return () => {
      isActive = false;
      leaveGroupRealtimeRoom(roomId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("meeting:updated", handleGroupRealtimeUpdate);
      socket.off("vote:updated", handleGroupRealtimeUpdate);
      socket.off("place:created", handleGroupRealtimeUpdate);
      socket.off("place:deleted", handleGroupRealtimeUpdate);
      socket.off("final-place:updated", handleGroupRealtimeUpdate);
    };
  }, [roomId, participant, refreshMeeting]);


  const isHost =
    !!meeting &&
    !!participant &&
    meeting.hostParticipantId === participant.participantId;

  const isClosed = meeting ? !!meeting.finalPlaceId : false;

  const sortedPlaces = meeting
    ? [...meeting.places].sort((a, b) => {
        const aIsFinal = meeting.finalPlaceId === a.placeId;
        const bIsFinal = meeting.finalPlaceId === b.placeId;

        if (aIsFinal !== bIsFinal) {
          return aIsFinal ? -1 : 1;
        }

        const voteDiff =
          b.voteParticipantIds.length - a.voteParticipantIds.length;

        if (voteDiff !== 0) {
          return voteDiff;
        }

        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      })
    : [];

  const [reorderedPlaceIds, setReorderedPlaceIds] = useState<string[]>([]);
  const [votePulseVersionByPlaceId, setVotePulseVersionByPlaceId] = useState<
    Record<string, number>
  >({});
  const previousSortedPlaceIdsRef = useRef<string[]>([]);
  const previousVoteCountsRef = useRef<Record<string, number>>({});

  const maxVoteCount = sortedPlaces.reduce((max, place) => {
    if (meeting?.finalPlaceId === place.placeId) {
      return max;
    }
    return Math.max(max, place.voteParticipantIds.length);
  }, 0);

  const leadingPlaceIds =
    maxVoteCount > 0
      ? sortedPlaces
          .filter(
            (place) =>
              meeting?.finalPlaceId !== place.placeId &&
              place.voteParticipantIds.length === maxVoteCount,
          )
          .map((place) => place.placeId)
      : [];

  const finalPlace = meeting?.finalPlaceId
    ? (meeting.places.find((place) => place.placeId === meeting.finalPlaceId) ??
      null)
    : null;

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined" || !meeting) {
      return "";
    }
    return `${window.location.origin}/meeting/${meeting.roomId}`;
  }, [meeting]);

  const hasValidDeadline = meeting ? isValidDateString(meeting.deadlineAt) : false;
  const formattedDeadline =
    meeting && hasValidDeadline ? formatDeadline(meeting.deadlineAt) : "마감 정보 없음";
  const deadlineStatus =
    meeting && hasValidDeadline
      ? getDeadlineStatus(meeting.deadlineAt)
      : "현재 group API에는 deadlineAt이 없습니다.";
  const isDeadlinePassed =
    meeting && hasValidDeadline
      ? new Date(meeting.deadlineAt).getTime() <= Date.now()
      : false;

  useEffect(() => {
    if (!meeting) {
      previousSortedPlaceIdsRef.current = [];
      previousVoteCountsRef.current = {};
      setReorderedPlaceIds([]);
      return;
    }

    const nextSortedIds = sortedPlaces.map((place) => place.placeId);
    const prevSortedIds = previousSortedPlaceIdsRef.current;

    if (prevSortedIds.length > 0) {
      const changedOrderIds = nextSortedIds.filter(
        (placeId, index) => prevSortedIds[index] !== placeId,
      );

      if (changedOrderIds.length > 0) {
        setReorderedPlaceIds(changedOrderIds);

        const timeout = window.setTimeout(() => {
          setReorderedPlaceIds([]);
        }, 550);

        previousSortedPlaceIdsRef.current = nextSortedIds;
        return () => window.clearTimeout(timeout);
      }
    }

    previousSortedPlaceIdsRef.current = nextSortedIds;
  }, [meeting, sortedPlaces]);

  useEffect(() => {
    if (!meeting) {
      previousVoteCountsRef.current = {};
      return;
    }

    const nextVoteCounts = Object.fromEntries(
      meeting.places.map((place) => [
        place.placeId,
        place.voteParticipantIds.length,
      ]),
    );

    const changedIds = Object.keys(nextVoteCounts).filter(
      (placeId) =>
        previousVoteCountsRef.current[placeId] !== nextVoteCounts[placeId],
    );

    if (changedIds.length > 0) {
      setVotePulseVersionByPlaceId((prev) => {
        const next = { ...prev };

        changedIds.forEach((placeId) => {
          next[placeId] = (next[placeId] ?? 0) + 1;
        });

        return next;
      });
    }

    previousVoteCountsRef.current = nextVoteCounts;
  }, [meeting]);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roomId || isJoining) {
      return;
    }

    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setAuthError("닉네임을 입력해주세요.");
      return;
    }

    if (!password.trim()) {
      setAuthError("비밀번호를 입력해주세요.");
      return;
    }

    setAuthError("");
    setIsJoining(true);

    try {
      const user = await enterGroup({
        groupCode: roomId,
        name: trimmedNickname,
        password,
      });

      const session: ParticipantSession = {
        participantId: String(user.id),
        nickname: user.name,
        joinedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(
        getParticipantStorageKey(roomId),
        JSON.stringify(session),
      );

      setParticipant(session);
      setPassword("");
      await refreshMeeting(roomId);
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "입장 처리 중 문제가 발생했습니다.",
      );
    } finally {
      setIsJoining(false);
    }
  }

  function handleMoveToPlace(place: {
    lat: number | null;
    lng: number | null;
  }) {
    if (place.lat == null || place.lng == null) {
      return;
    }

    const nextLocation = {
      lat: place.lat,
      lng: place.lng,
    };

    setSelectedLocation(nextLocation);
    setMapCenter(nextLocation);
    setMapZoom(16);
  }

  async function handleAddPlace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roomId || !participant) {
      return;
    }

    setPlaceError("");
    setVoteError("");
    setIsAddingPlace(true);

    try {
      const result = await addCandidatePlace({
        groupCode: roomId,
        userId: participant.participantId,
        name: newPlaceName,
        lat: selectedLocation?.lat ?? null,
        lng: selectedLocation?.lng ?? null,
      });

      if (!result.ok) {
        setPlaceError(result.message);
        return;
      }

      setNewPlaceName("");
      setSelectedLocation(null);
      await refreshMeeting(roomId);
    } finally {
      setIsAddingPlace(false);
    }
  }

  async function handleVote(placeId: string) {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = await toggleCandidatePlaceVote({
      groupCode: roomId,
      userId: participant.participantId,
      placeId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    await refreshMeeting(roomId);
  }

  async function handleDeletePlace(placeId: string) {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = await removeCandidatePlace({
      groupCode: roomId,
      userId: participant.participantId,
      placeId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    await refreshMeeting(roomId);
  }

  async function handleSetFinalPlace(placeId: string) {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = await setFinalCandidatePlace({
      groupCode: roomId,
      userId: participant.participantId,
      placeId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    await refreshMeeting(roomId);
  }

  async function handleClearFinalPlace() {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = await clearFinalCandidatePlace({
      groupCode: roomId,
      userId: participant.participantId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    await refreshMeeting(roomId);
  }

  async function handleCopyInviteLink() {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyMessage("초대 링크가 복사되었습니다.");
    } catch {
      setCopyMessage("초대 링크 복사에 실패했습니다.");
    }
  }

  async function handleCopyJoinCode() {
    if (!meeting?.joinCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(meeting.joinCode);
      setCopyMessage("참여 코드가 복사되었습니다.");
    } catch {
      setCopyMessage("참여 코드 복사에 실패했습니다.");
    }
  }

  function handleLogout() {
    if (!roomId) {
      return;
    }

    window.localStorage.removeItem(getParticipantStorageKey(roomId));
    setParticipant(null);
    setNickname("");
    setPassword("");
    setAuthError("");
    setPlaceError("");
    setVoteError("");
    setNewPlaceName("");
    setSelectedLocation(null);
    setMapCenter(defaultCenter);
    setMapZoom(13);
    setCopyMessage("");
  }

  function getVoteTooltip(place: MeetingRecord["places"][number]) {
    const voterNames = place.voteParticipantIds
      .map((participantId) => {
        const found = meeting?.participants.find(
          (item) => item.participantId === participantId,
        );
        return found?.nickname ?? null;
      })
      .filter(Boolean) as string[];

    return voterNames.length > 0
      ? `투표: ${voterNames.join(", ")}`
      : "아직 투표 없음";
  }

  return (
    <GoogleMapsProvider>
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
                    서버에서 해당 참여 코드를 가진 모임을 찾지 못했거나,
                    유효하지 않은 접근일 수 있습니다.
                  </p>
                </div>
              </div>
            ) : !participant ? (
              <div className="create-form-card create-form-simple">
                <div className="create-page-heading">
                  <p className="create-page-eyebrow">ENTER MEETING</p>
                  <h1>{meeting.title}</h1>
                  <p className="create-page-description">
                    이 방에서 사용할 닉네임과 비밀번호를 입력해주세요.
                    입력 정보는 POST /api/groups/[code]/users로 전달됩니다.
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

                  {authError && (
                    <p className="create-error-text">{authError}</p>
                  )}

                  <button
                    type="submit"
                    className="create-submit-button"
                    disabled={isJoining}
                  >
                    {isJoining ? "입장 중..." : "이 닉네임으로 입장하기"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="create-form-card create-form-simple meeting-room-card">
                <section
                  className={`meeting-top-summary ${
                    isTopSummaryExpanded ? "is-expanded" : "is-collapsed"
                  }`}
                >
                  <div className="meeting-top-summary-header">
                    <div>
                      <p className="meeting-top-summary-title">모임 정보</p>
                      <p className="meeting-top-summary-subtitle">
                        회의 제목, 참여자, 참여 코드, 마감 기한, 초대 링크
                      </p>
                    </div>

                    <button
                      type="button"
                      className="cta-button secondary meeting-top-summary-toggle"
                      onClick={() => setIsTopSummaryExpanded((prev) => !prev)}
                      aria-expanded={isTopSummaryExpanded}
                    >
                      {isTopSummaryExpanded ? "접기" : "펼치기"}
                    </button>
                  </div>

                  {isTopSummaryExpanded && (
                    <div className="meeting-hero-row meeting-top-summary-body">
                      <div className="create-page-heading meeting-page-heading-compact">
                        <p className="create-page-eyebrow">MEETING ROOM</p>
                        <h1>{meeting.title}</h1>
                        <p className="create-page-description">
                          이제 이 안에서 후보 장소를 모으고 투표를 시작할 수
                          있습니다.
                        </p>
                      </div>

                      <div className="meeting-top-meta-grid">
                        <div className="meeting-meta-chip meeting-meta-chip-strong">
                          <span className="meeting-meta-chip-label">
                            참여자
                          </span>
                          <strong>
                            {participant.nickname}
                            {isHost ? " · 호스트" : ""}
                          </strong>
                        </div>

                        <div className="meeting-meta-chip">
                          <span className="meeting-meta-chip-label">
                            참여 코드
                          </span>
                          <div className="meeting-meta-chip-inline meeting-meta-chip-inline-code">
                            <strong className="meeting-join-code-value">
                              {meeting.joinCode}
                            </strong>
                            <button
                              type="button"
                              className="cta-button secondary meeting-chip-button"
                              onClick={handleCopyJoinCode}
                            >
                              복사
                            </button>
                          </div>
                        </div>

                        <div
                          className={`meeting-meta-chip meeting-deadline-chip ${
                            isDeadlinePassed ? "is-passed" : ""
                          }`}
                        >
                          <span className="meeting-meta-chip-label">
                            투표 마감 기한
                          </span>
                          <div className="meeting-meta-chip-deadline">
                            <strong>{formattedDeadline}</strong>
                            <span className="meeting-deadline-status">
                              {deadlineStatus}
                            </span>
                          </div>
                        </div>

                        <div className="meeting-meta-chip meeting-link-chip">
                          <span className="meeting-meta-chip-label">
                            초대 링크
                          </span>
                          <div className="meeting-link-chip-content">
                            <p className="meeting-link-chip-description">
                              참여용 링크를 복사해 다른 사람에게 바로 공유할 수
                              있습니다.
                            </p>
                            <button
                              type="button"
                              className="cta-button primary meeting-chip-button"
                              onClick={handleCopyInviteLink}
                            >
                              링크 복사
                            </button>
                          </div>
                        </div>
                      </div>

                      {copyMessage && (
                        <p className="meeting-copy-message">{copyMessage}</p>
                      )}
                    </div>
                  )}
                </section>

                {isClosed && (
                  <p className="create-inline-note meeting-closed-note">
                    최종 결정이 완료되어 장소 추가, 투표, 삭제는
                    비활성화되었습니다.
                  </p>
                )}

                <p className="create-inline-note meeting-closed-note">
                  현재 백엔드는 그룹/유저 API까지만 연결되어 있습니다. 후보
                  장소 추가, 투표, 최종 결정은 places/votes API가 생기기 전까지
                  기존 localStorage 함수에 임시로 의존합니다.
                </p>

                <p className="create-inline-note meeting-closed-note">
                  실시간 연결 상태: {socketStatus === "connected"
                    ? "연결됨"
                    : socketStatus === "connecting"
                      ? "연결 중"
                      : socketStatus === "disconnected"
                        ? "연결 끊김"
                        : socketStatus === "disabled"
                          ? "비활성화됨"
                          : "대기 중"}
                  {realtimeMessage ? ` · ${realtimeMessage}` : ""}
                </p>

                <div className="meeting-place-panel meeting-place-panel-static">
                  <div className="meeting-place-panel-body">
                    <div className="meeting-map-column">
                      <div className="meeting-map-card">
                        <div className="meeting-map-card-header">
                          <p className="create-submit-preview-title">
                            {isClosed
                              ? "최종 장소 위치 확인"
                              : "지도에서 위치 선택"}
                          </p>
                          <p className="meeting-map-card-description">
                            {isClosed
                              ? "최종 확정 후에도 지도를 드래그하거나 확대해서 위치를 확인할 수 있습니다."
                              : "검색하거나 지도를 직접 눌러 후보 장소 위치를 고를 수 있습니다."}
                          </p>
                        </div>

                        {!isClosed && (
                          <div className="create-form-group">
                            <label>장소 검색</label>
                            <PlaceSearchInput
                              onTextChange={(text) => {
                                setNewPlaceName(text);
                                if (placeError) {
                                  setPlaceError("");
                                }
                              }}
                              onPlaceSelect={(place) => {
                                const nextLocation = {
                                  lat: place.lat,
                                  lng: place.lng,
                                };
                                setNewPlaceName(place.name);
                                setSelectedLocation(nextLocation);
                                setMapCenter(nextLocation);
                                setMapZoom(16);
                                if (placeError) {
                                  setPlaceError("");
                                }
                              }}
                              placeholder="예: 강남역 스타벅스"
                            />
                          </div>
                        )}

                        <div className="meeting-map-box-next">
                          <Map
                            center={mapCenter}
                            zoom={mapZoom}
                            gestureHandling="greedy"
                            disableDefaultUI={false}
                            mapId="DEMO_MAP_ID"
                            style={{ width: "100%", height: "100%" }}
                            onCameraChanged={(event) => {
                              const nextCenter = event.detail.center;
                              const nextZoom = event.detail.zoom;
                              setMapCenter({
                                lat: nextCenter.lat,
                                lng: nextCenter.lng,
                              });
                              setMapZoom(nextZoom);
                            }}
                            onClick={(event) => {
                              if (isClosed) {
                                return;
                              }
                              const latLng = event.detail.latLng;
                              if (!latLng) {
                                return;
                              }
                              const nextLocation = {
                                lat: latLng.lat,
                                lng: latLng.lng,
                              };
                              setSelectedLocation(nextLocation);
                              if (placeError) {
                                setPlaceError("");
                              }
                            }}
                          >
                            {selectedLocation && (
                              <AdvancedMarker position={selectedLocation} />
                            )}
                            {meeting.places.map((place) => {
                              if (place.lat == null || place.lng == null) {
                                return null;
                              }
                              return (
                                <AdvancedMarker
                                  key={place.placeId}
                                  position={{ lat: place.lat, lng: place.lng }}
                                />
                              );
                            })}
                          </Map>
                        </div>

                        {selectedLocation && !isClosed && (
                          <p className="meeting-selected-location-text">
                            선택한 위치: {selectedLocation.lat.toFixed(5)},{" "}
                            {selectedLocation.lng.toFixed(5)}
                          </p>
                        )}
                      </div>

                      {!isClosed && (
                        <form
                          className="meeting-add-place-form"
                          onSubmit={handleAddPlace}
                        >
                          <div className="create-form-group">
                            <label htmlFor="newPlaceName">후보 장소 이름</label>
                            <input
                              id="newPlaceName"
                              type="text"
                              placeholder="예: 강남역 스타벅스"
                              value={newPlaceName}
                              onChange={(event) => {
                                setNewPlaceName(event.target.value);
                                if (placeError) {
                                  setPlaceError("");
                                }
                              }}
                            />
                          </div>

                          {placeError && (
                            <p className="create-error-text">{placeError}</p>
                          )}

                          <button
                            type="submit"
                            className="create-submit-button meeting-add-place-submit"
                            disabled={isAddingPlace}
                          >
                            {isAddingPlace
                              ? "추가 중..."
                              : "후보 장소 추가하기"}
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="create-submit-preview meeting-results-card meeting-results-card-scrollable">
                      <div className="meeting-results-header">
                        <p className="create-submit-preview-title">
                          현재 후보 장소
                        </p>
                        <span className="meeting-results-count">
                          총 {sortedPlaces.length}개
                        </span>
                      </div>

                      {voteError && (
                        <p className="create-error-text">{voteError}</p>
                      )}

                      {meeting.finalPlaceId && (
                        <div
                          className="meeting-final-banner clickable-place-card"
                          onClick={() => {
                            const selectedFinalPlace = meeting.places.find(
                              (place) => place.placeId === meeting.finalPlaceId,
                            );

                            if (selectedFinalPlace) {
                              handleMoveToPlace(selectedFinalPlace);
                            }
                          }}
                        >
                          <div className="meeting-final-banner-head">
                            <div>
                              <p className="meeting-final-label">
                                최종 결정된 장소
                              </p>
                              <p className="meeting-final-name">
                                {finalPlace?.name}
                              </p>
                            </div>

                            {isHost && (
                              <button
                                type="button"
                                className="cta-button meeting-inline-button meeting-clear-final-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleClearFinalPlace();
                                }}
                              >
                                최종 결정 해제
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {sortedPlaces.length === 0 ? (
                        <p className="create-page-description meeting-empty-text">
                          아직 추가된 후보 장소가 없습니다.
                        </p>
                      ) : (
                        <div className="meeting-place-list-scroll">
                          <ul className="meeting-place-list-simple">
                            {sortedPlaces.map((place) => {
                              const hasVoted = participant
                                ? place.voteParticipantIds.includes(
                                    participant.participantId,
                                  )
                                : false;
                              const isFinal =
                                meeting.finalPlaceId === place.placeId;
                              const isLeader =
                                !meeting.finalPlaceId &&
                                leadingPlaceIds.includes(place.placeId);
                              const canDelete =
                                !!participant &&
                                place.createdByParticipantId ===
                                  participant.participantId &&
                                !isClosed;
                              const votePulseVersion =
                                votePulseVersionByPlaceId[place.placeId] ?? 0;
                              const voteTooltip = getVoteTooltip(place);
                              const actionCount =
                                1 +
                                (canDelete ? 1 : 0) +
                                (isHost && !isFinal ? 1 : 0);

                              return (
                                <li
                                  key={place.placeId}
                                  className={`meeting-place-item-simple clickable-place-card ${
                                    isFinal ? "is-final" : ""
                                  } ${isLeader ? "is-leading" : ""} ${
                                    reorderedPlaceIds.includes(place.placeId)
                                      ? "is-reordered"
                                      : ""
                                  }`}
                                  onClick={() => handleMoveToPlace(place)}
                                >
                                  <div className="meeting-place-main">
                                    <div className="meeting-place-copy">
                                      <strong>{place.name}</strong>
                                      <p className="meeting-place-meta">
                                        추가한 사람: {place.createdByNickname}
                                      </p>
                                      {isFinal && (
                                        <p className="meeting-final-chip">
                                          최종 확정됨
                                        </p>
                                      )}
                                    </div>

                                    <div className="meeting-place-badges">
                                      {isLeader && (
                                        <span className="meeting-leader-chip">
                                          현재 1위
                                        </span>
                                      )}
                                      <span
                                        key={`${place.placeId}-${votePulseVersion}`}
                                        className="meeting-vote-count"
                                        title={voteTooltip}
                                      >
                                        {place.voteParticipantIds.length}표
                                      </span>
                                    </div>
                                  </div>

                                  {!isClosed && (
                                    <div
                                      className={`meeting-place-actions actions-${actionCount}`}
                                    >
                                      <button
                                        type="button"
                                        className={`cta-button meeting-inline-button ${
                                          hasVoted
                                            ? "meeting-vote-cancel-button"
                                            : "meeting-vote-button"
                                        }`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleVote(place.placeId);
                                        }}
                                      >
                                        {hasVoted ? "투표 취소" : "투표하기"}
                                      </button>

                                      {canDelete && (
                                        <button
                                          type="button"
                                          className="cta-button meeting-inline-button meeting-delete-button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleDeletePlace(place.placeId);
                                          }}
                                        >
                                          장소 삭제
                                        </button>
                                      )}

                                      {isHost && !isFinal && (
                                        <button
                                          type="button"
                                          className="cta-button meeting-inline-button meeting-confirm-button"
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleSetFinalPlace(place.placeId);
                                          }}
                                        >
                                          최종 결정
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="create-submit-button meeting-logout-button"
                  onClick={handleLogout}
                >
                  이 방에서 로그아웃
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </GoogleMapsProvider>
  );
}
