"use client";

import { useEffect, useMemo, useState } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import Header from "../../components/Header";
import GoogleMapsProvider from "../../components/GoogleMapsProvider";
import PlaceSearchInput from "../../components/PlaceSearchInput";
import {
  addPlaceToMeeting,
  getMeetingByRoomId,
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

function MapMover({ target }: { target: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) {
      return;
    }

    map.panTo(target);
    map.setZoom(16);
  }, [map, target]);

  return null;
}

function getParticipantStorageKey(roomId: string) {
  return `where-to-meet:participant:${roomId}`;
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const [roomId, setRoomId] = useState("");
  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [isLoadingMeeting, setIsLoadingMeeting] = useState(true);

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [participant, setParticipant] = useState<ParticipantSession | null>(null);
  const [authError, setAuthError] = useState("");

  const [newPlaceName, setNewPlaceName] = useState("");
  const [placeError, setPlaceError] = useState("");
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [mapTarget, setMapTarget] = useState<LatLng | null>(null);
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

  async function handleAddPlace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!roomId || !participant) {
      return;
    }

    setPlaceError("");

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
    setMapTarget(null);
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
    setNewPlaceName("");
    setSelectedLocation(null);
    setMapTarget(null);
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
                        setMapTarget(nextLocation);

                        if (placeError) {
                          setPlaceError("");
                        }
                      }}
                      placeholder="예: 강남역 스타벅스"
                    />
                  </div>

                  <div className="meeting-map-box-next">
                    <Map
                      defaultCenter={{ lat: 37.4979, lng: 127.0276 }}
                      defaultZoom={13}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      mapId="DEMO_MAP_ID"
                      style={{ width: "100%", height: "100%" }}
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
                        setMapTarget(nextLocation);

                        if (placeError) {
                          setPlaceError("");
                        }
                      }}
                    >
                      <MapMover target={mapTarget} />

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

                  <button type="submit" className="create-submit-button" disabled={isAddingPlace}>
                    {isAddingPlace ? "추가 중..." : "후보 장소 추가하기"}
                  </button>
                </form>

                <div className="create-submit-preview">
                  <p className="create-submit-preview-title">현재 후보 장소</p>

                  {meeting.places.length === 0 ? (
                    <p className="create-page-description">
                      아직 추가된 후보 장소가 없습니다.
                    </p>
                  ) : (
                    <ul className="meeting-place-list-simple">
                      {meeting.places.map((place) => (
                        <li key={place.placeId} className="meeting-place-item-simple">
                          <div>
                            <strong>{place.name}</strong>
                            <p className="meeting-place-meta">
                              추가한 사람: {place.createdByNickname}
                            </p>
                          </div>
                          <span className="meeting-vote-count">
                            {place.voteParticipantIds.length}표
                          </span>
                        </li>
                      ))}
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