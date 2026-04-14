"use client";

import { useEffect, useMemo, useState } from "react";
import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import Header from "../../components/Header";
import GoogleMapsProvider from "../../components/GoogleMapsProvider";
import PlaceSearchInput from "../../components/PlaceSearchInput";
import {
  addPlaceToMeeting,
  clearFinalPlace,
  getMeetingByRoomId,
  removePlaceFromMeeting,
  setFinalPlace,
  toggleVoteForPlace,
  upsertParticipant,
  type MeetingRecord,
} from "../../lib/meetingStorage";

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

function getParticipantStorageKey(roomId: string) {
  return `where-to-meet:participant:${roomId}`;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const defaultCenter = { lat: 37.4979, lng: 127.0276 };

  const [roomId, setRoomId] = useState("");
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [authError, setAuthError] = useState("");

  const [newPlaceName, setNewPlaceName] = useState("");
  const [placeError, setPlaceError] = useState("");
  const [voteError, setVoteError] = useState("");
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    params.then(({ roomId }) => {
      setRoomId(roomId);
    });
  }, [params]);

  function refreshMeeting(targetRoomId: string) {
    const foundMeeting = getMeetingByRoomId(targetRoomId);
    setMeeting(foundMeeting);
  }

  useEffect(() => {
    if (!roomId) {
      return;
    }

    setIsLoadingMeeting(true);

    try {
      refreshMeeting(roomId);

      const savedParticipant = window.localStorage.getItem(
        getParticipantStorageKey(roomId)
      );

      if (savedParticipant) {
        try {
          const parsed = JSON.parse(savedParticipant) as ParticipantSession;
          setParticipant(parsed);
        } catch {
          window.localStorage.removeItem(getParticipantStorageKey(roomId));
        }
      }
    } finally {
      setIsLoadingMeeting(false);
    }
  }, [roomId]);

  const isHost =
    !!meeting &&
    !!participant &&
    meeting.hostParticipantId === participant.participantId;

  const isClosed = meeting ? !!meeting.finalPlaceId : false;

  const sortedPlaces = meeting
    ? [...meeting.places].sort((a, b) => {
        const voteDiff = b.voteParticipantIds.length - a.voteParticipantIds.length;

        if (voteDiff !== 0) {
          return voteDiff;
        }

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
    : [];

  const inviteLink = useMemo(() => {
    if (typeof window === "undefined" || !meeting) {
      return "";
    }
    return `${window.location.origin}/meeting/${meeting.roomId}`;
  }, [meeting]);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roomId) {
      return;
    }

    setAuthError("");

    const result = upsertParticipant({
      roomId,
      nickname,
      password,
    });

    if (!result.ok) {
      setAuthError(result.message);
      return;
    }

    const session: ParticipantSession = {
      participantId: result.participant.participantId,
      nickname: result.participant.nickname,
      joinedAt: result.participant.joinedAt,
    };

    window.localStorage.setItem(
      getParticipantStorageKey(roomId),
      JSON.stringify(session)
    );

    setParticipant(session);
    setPassword("");
    refreshMeeting(roomId);
  }

  function handleMoveToPlace(place: { lat: number | null; lng: number | null }) {
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
      const result = addPlaceToMeeting({
        roomId,
        participantId: participant.participantId,
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
      refreshMeeting(roomId);
    } finally {
      setIsAddingPlace(false);
    }
  }

  function handleVote(placeId: string) {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = toggleVoteForPlace({
      roomId,
      participantId: participant.participantId,
      placeId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    refreshMeeting(roomId);
  }

  function handleDeletePlace(placeId: string) {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = removePlaceFromMeeting({
      roomId,
      participantId: participant.participantId,
      placeId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    refreshMeeting(roomId);
  }

  function handleSetFinalPlace(placeId: string) {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = setFinalPlace({
      roomId,
      participantId: participant.participantId,
      placeId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    refreshMeeting(roomId);
  }

  function handleClearFinalPlace() {
    if (!roomId || !participant) {
      return;
    }

    setVoteError("");

    const result = clearFinalPlace({
      roomId,
      participantId: participant.participantId,
    });

    if (!result.ok) {
      setVoteError(result.message);
      return;
    }

    refreshMeeting(roomId);
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
                    이 브라우저에 저장된 방이 없거나, 유효하지 않은 접근일 수 있습니다.
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
                    첫 입장자는 자동으로 호스트가 됩니다.
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

                  <button type="submit" className="create-submit-button">
                    이 닉네임으로 입장하기
                  </button>
                </form>
              </div>
            ) : (
              <div className="create-form-card create-form-simple">
                <div className="create-page-heading">
                  <p className="create-page-eyebrow">MEETING ROOM</p>
                  <h1>{meeting.title}</h1>
                  <p className="create-page-description">
                    이제 이 안에서 후보 장소를 모으고 투표를 시작할 수 있습니다.
                  </p>
                </div>

                <div className="create-inline-note">
                  현재 참여자: <strong>{participant.nickname}</strong>
                  {isHost && (
                    <>
                      {" "}
                      · <strong>호스트</strong>
                    </>
                  )}
                </div>

                <div className="meeting-share-box">
                  <div className="meeting-share-row">
                    <div>
                      <p className="meeting-share-label">참여 코드</p>
                      <p className="meeting-share-value">{meeting.joinCode}</p>
                    </div>
                    <button
                      type="button"
                      className="cta-button secondary meeting-share-button"
                      onClick={handleCopyJoinCode}
                    >
                      참여 코드 복사
                    </button>
                  </div>

                  <div className="meeting-share-row">
                    <div className="meeting-share-flex">
                      <p className="meeting-share-label">초대 링크</p>
                      <p className="meeting-share-link">{inviteLink}</p>
                    </div>
                    <button
                      type="button"
                      className="cta-button primary meeting-share-button"
                      onClick={handleCopyInviteLink}
                    >
                      링크 복사
                    </button>
                  </div>

                  {copyMessage && <p className="meeting-copy-message">{copyMessage}</p>}
                </div>

                <div className="meeting-map-card">
                  <p className="create-submit-preview-title">지도에서 위치 선택</p>

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
                      {selectedLocation && <AdvancedMarker position={selectedLocation} />}

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

                  {selectedLocation && (
                    <p className="meeting-selected-location-text">
                      선택한 위치: {selectedLocation.lat.toFixed(5)},{" "}
                      {selectedLocation.lng.toFixed(5)}
                    </p>
                  )}
                </div>

                {!isClosed && (
                  <form className="create-form-simple" onSubmit={handleAddPlace}>
                    <div className="create-form-group">
                      <label htmlFor="newPlaceName">후보 장소 추가</label>
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

                    {placeError && <p className="create-error-text">{placeError}</p>}

                    <button
                      type="submit"
                      className="create-submit-button"
                      disabled={isAddingPlace}
                    >
                      {isAddingPlace ? "추가 중..." : "후보 장소 추가하기"}
                    </button>
                  </form>
                )}

                {isClosed && (
                  <p className="create-inline-note">
                    최종 결정이 완료되어 장소 추가, 투표, 삭제는 비활성화되었습니다.
                  </p>
                )}

                <div className="create-submit-preview">
                  <p className="create-submit-preview-title">현재 후보 장소</p>

                  {voteError && <p className="create-error-text">{voteError}</p>}

                  {meeting.finalPlaceId && (
                    <div
                      className="meeting-final-banner clickable-place-card"
                      onClick={() => {
                        const finalPlace = meeting.places.find(
                          (place) => place.placeId === meeting.finalPlaceId
                        );

                        if (finalPlace) {
                          handleMoveToPlace(finalPlace);
                        }
                      }}
                    >
                      <p className="meeting-final-label">최종 결정된 장소</p>
                      <p className="meeting-final-name">
                        {
                          meeting.places.find(
                            (place) => place.placeId === meeting.finalPlaceId
                          )?.name
                        }
                      </p>

                      {isHost && (
                        <button
                          type="button"
                          className="cta-button secondary meeting-inline-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleClearFinalPlace();
                          }}
                        >
                          최종 결정 해제
                        </button>
                      )}
                    </div>
                  )}

                  {sortedPlaces.length === 0 ? (
                    <p className="create-page-description">
                      아직 추가된 후보 장소가 없습니다.
                    </p>
                  ) : (
                    <ul className="meeting-place-list-simple">
                      {sortedPlaces.map((place) => {
                        const hasVoted = participant
                          ? place.voteParticipantIds.includes(participant.participantId)
                          : false;

                        const isFinal = meeting.finalPlaceId === place.placeId;

                        const voterNames = place.voteParticipantIds
                          .map((participantId) => {
                            const found = meeting.participants.find(
                              (item) => item.participantId === participantId
                            );
                            return found?.nickname ?? null;
                          })
                          .filter(Boolean)
                          .join(", ");

                        const canDelete =
                          !!participant &&
                          place.createdByParticipantId === participant.participantId &&
                          !isClosed;

                        return (
                          <li
                            key={place.placeId}
                            className={`meeting-place-item-simple clickable-place-card ${
                              isFinal ? "is-final" : ""
                            }`}
                            onClick={() => handleMoveToPlace(place)}
                          >
                            <div className="meeting-place-main">
                              <div>
                                <strong>{place.name}</strong>
                                <p className="meeting-place-meta">
                                  추가한 사람: {place.createdByNickname}
                                </p>
                                <p className="meeting-place-meta">
                                  투표한 사람: {voterNames || "아직 없음"}
                                </p>
                                {isFinal && <p className="meeting-final-chip">최종 확정됨</p>}
                              </div>

                              <span className="meeting-vote-count">
                                {place.voteParticipantIds.length}표
                              </span>
                            </div>

                            {!isClosed && (
                              <div className="meeting-place-actions">
                                <button
                                  type="button"
                                  className={`cta-button ${
                                    hasVoted ? "secondary" : "primary"
                                  } meeting-inline-button`}
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
                                    className="cta-button secondary meeting-inline-button meeting-delete-button"
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
                                    className="cta-button secondary meeting-inline-button"
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
                  )}
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
    </GoogleMapsProvider>
  );
}