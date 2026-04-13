"use client";

import { useEffect, useMemo, useState } from "react";
import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import Header from "../components/Header";
import PlaceSearchInput from "../components/PlaceSearchInput";

type LatLng = {
  lat: number;
  lng: number;
};

type SelectedPlace = {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
};

type CandidatePlace = {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
};

type ErrorState = {
  meetingName?: string;
  deadline?: string;
  place?: string;
  places?: string;
};

function MapMover({ target }: { target: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;

    map.panTo(target);
    map.setZoom(17);
  }, [map, target]);

  return null;
}

function getDefaultDeadlineValue() {
  const now = new Date();
  now.setHours(now.getHours() + 2);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function CreatePage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const hasApiKey = useMemo(() => apiKey.trim() !== "", [apiKey]);

  const [meetingName, setMeetingName] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadlineValue());

  const [searchText, setSearchText] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [places, setPlaces] = useState<CandidatePlace[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [mapTarget, setMapTarget] = useState<LatLng | null>(null);

  const [errors, setErrors] = useState<ErrorState>({});
  const [submitPreview, setSubmitPreview] = useState("");

  function clearPlaceError() {
    setErrors((prev) => ({
      ...prev,
      place: "",
      places: "",
    }));
  }

  function handleSelectPlace(place: SelectedPlace) {
    const nextLocation = {
      lat: place.lat,
      lng: place.lng,
    };

    setSearchText(place.name);
    setSelectedPlace(place);
    setSelectedLocation(nextLocation);
    setMapTarget(nextLocation);
    clearPlaceError();
  }

  function handleMapClick(latLng: LatLng) {
    setSelectedLocation(latLng);
    setMapTarget(latLng);

    setSelectedPlace((prev) => ({
      name: searchText.trim() || prev?.name || "",
      lat: latLng.lat,
      lng: latLng.lng,
      address: prev?.address || "",
      placeId: prev?.placeId || "",
    }));

    clearPlaceError();
  }

  function handleAddPlace() {
    const trimmedName = searchText.trim();

    if (!selectedLocation) {
      setErrors((prev) => ({
        ...prev,
        place: "먼저 자동완성으로 장소를 선택하거나 지도에서 위치를 클릭해주세요.",
      }));
      return;
    }

    if (trimmedName === "") {
      setErrors((prev) => ({
        ...prev,
        place: "장소 이름을 입력하거나 자동완성 항목을 선택해주세요.",
      }));
      return;
    }

    const isDuplicate = places.some(
      (place) =>
        place.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        Math.abs(place.lat - selectedLocation.lat) < 0.000001 &&
        Math.abs(place.lng - selectedLocation.lng) < 0.000001
    );

    if (isDuplicate) {
      setErrors((prev) => ({
        ...prev,
        place: "이미 추가된 장소입니다.",
      }));
      return;
    }

    const nextPlace: CandidatePlace = {
      name: trimmedName,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedPlace?.address ?? "",
      placeId: selectedPlace?.placeId ?? "",
    };

    setPlaces((prev) => [...prev, nextPlace]);
    setSearchText("");
    setSelectedPlace(null);
    setSelectedLocation(null);
    setMapTarget(null);
    setSubmitPreview("");

    setErrors((prev) => ({
      ...prev,
      place: "",
      places: "",
    }));
  }

  function handleDeletePlace(indexToDelete: number) {
    const nextPlaces = places.filter((_, index) => index !== indexToDelete);
    setPlaces(nextPlaces);

    if (nextPlaces.length === 0) {
      setErrors((prev) => ({
        ...prev,
        places: "후보 장소를 최소 1개 이상 추가해야 합니다.",
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        places: "",
      }));
    }
  }

  function validateForm() {
    const nextErrors: ErrorState = {};

    if (meetingName.trim() === "") {
      nextErrors.meetingName = "모임 이름은 반드시 입력해야 합니다.";
    }

    if (deadline.trim() === "") {
      nextErrors.deadline = "마감 일시를 설정해주세요.";
    } else {
      const deadlineDate = new Date(deadline);

      if (Number.isNaN(deadlineDate.getTime())) {
        nextErrors.deadline = "올바른 마감 일시를 입력해주세요.";
      } else if (deadlineDate.getTime() <= Date.now()) {
        nextErrors.deadline = "마감 일시는 현재 시각보다 이후여야 합니다.";
      }
    }

    if (places.length === 0) {
      nextErrors.places = "후보 장소를 최소 1개 이상 추가해야 합니다.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitPreview("");
      return;
    }

    const payload = {
      title: meetingName.trim(),
      deadlineAt: new Date(deadline).toISOString(),
      timeZone: "Asia/Seoul",
      places: places.map((place) => ({
        name: place.name,
        address: place.address ?? "",
        latitude: place.lat,
        longitude: place.lng,
        placeId: place.placeId ?? "",
      })),
    };

    setSubmitPreview(JSON.stringify(payload, null, 2));

    // 실제 서버 연결 예시
    // const response = await fetch("/api/meetings", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    //
    // if (!response.ok) {
    //   throw new Error("방 생성에 실패했습니다.");
    // }
    //
    // const data = await response.json();
    // router.push(`/meeting/${data.id}`);
  }

  return (
    <div className="app create-page">
      <Header />

      <main className="create-main">
        <section className="create-shell">
          <div className="create-page-heading">
            <p className="create-page-eyebrow">CREATE A MEET</p>
            <h1>모임 만들기</h1>
            <p className="create-page-description">
              모임 이름과 마감 시간, 후보 장소를 등록해 빠르게 장소 투표를 시작하세요.
            </p>
          </div>

          {hasApiKey ? (
            <APIProvider apiKey={apiKey} libraries={["places"]} region="KR">
              <form className="create-form-card" onSubmit={handleSubmit}>
                <div className="create-form-grid">
                  <div className="create-form-left">
                    <div className="create-form-group">
                      <label htmlFor="meetingName">모임 이름</label>
                      <input
                        id="meetingName"
                        type="text"
                        placeholder="예: 3학년 팀플 회의"
                        value={meetingName}
                        onChange={(event) => {
                          setMeetingName(event.target.value);
                          if (errors.meetingName) {
                            setErrors((prev) => ({ ...prev, meetingName: "" }));
                          }
                        }}
                      />
                      {errors.meetingName && (
                        <p className="create-error-text">{errors.meetingName}</p>
                      )}
                    </div>

                    <div className="create-form-group">
                      <label htmlFor="deadline">투표 마감 일시</label>
                      <input
                        id="deadline"
                        type="datetime-local"
                        value={deadline}
                        onChange={(event) => {
                          setDeadline(event.target.value);
                          if (errors.deadline) {
                            setErrors((prev) => ({ ...prev, deadline: "" }));
                          }
                        }}
                      />
                      {errors.deadline && (
                        <p className="create-error-text">{errors.deadline}</p>
                      )}
                    </div>

                    <div className="create-form-group">
                      <label htmlFor="placeSearch">장소 검색</label>
                      <PlaceSearchInput
                        value={searchText}
                        onValueChange={(text) => {
                          setSearchText(text);
                          clearPlaceError();
                        }}
                        onPlaceSelect={handleSelectPlace}
                        placeholder="예: 국민대학교앞"
                      />
                      {errors.place && <p className="create-error-text">{errors.place}</p>}
                    </div>

                    <div className="create-form-group">
                      <button
                        type="button"
                        className="create-add-place-button"
                        onClick={handleAddPlace}
                      >
                        선택한 장소 후보에 추가
                      </button>
                    </div>

                    <div className="create-form-group">
                      <label>현재 후보 장소</label>

                      {places.length === 0 ? (
                        <p className="create-empty-message">아직 추가된 장소가 없습니다.</p>
                      ) : (
                        <ul className="create-place-list">
                          {places.map((place, index) => (
                            <li key={`${place.name}-${index}`} className="create-place-item">
                              <div className="create-place-info">
                                <strong>{place.name}</strong>
                                <span>
                                  {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                                </span>
                                {place.address ? <span>{place.address}</span> : null}
                              </div>

                              <button
                                type="button"
                                className="create-delete-button"
                                onClick={() => handleDeletePlace(index)}
                              >
                                삭제
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {errors.places && (
                        <p className="create-error-text">{errors.places}</p>
                      )}
                    </div>
                  </div>

                  <div className="create-form-right">
                    <div className="create-map-section">
                      <div className="create-map-header">
                        <h2>지도에서 위치 선택</h2>
                        <p>
                          자동완성으로 장소를 선택하거나 지도를 직접 클릭해 후보 위치를 정할 수 있습니다.
                        </p>
                      </div>

                      <div className="create-map-box">
                        <Map
                          defaultCenter={{ lat: 37.6109, lng: 126.9975 }}
                          defaultZoom={14}
                          gestureHandling="greedy"
                          disableDefaultUI={false}
                          mapId="DEMO_MAP_ID"
                          style={{ width: "100%", height: "100%" }}
                          onClick={(event) => {
                            const latLng = event.detail.latLng;
                            if (!latLng) return;

                            handleMapClick({
                              lat: latLng.lat,
                              lng: latLng.lng,
                            });
                          }}
                        >
                          <MapMover target={mapTarget} />

                          {selectedLocation && <AdvancedMarker position={selectedLocation} />}

                          {places.map((place, index) => (
                            <AdvancedMarker
                              key={`${place.name}-${index}`}
                              position={{ lat: place.lat, lng: place.lng }}
                            />
                          ))}
                        </Map>
                      </div>

                      {selectedLocation && (
                        <p className="create-selected-location-text">
                          선택한 위치: {selectedLocation.lat.toFixed(5)},{" "}
                          {selectedLocation.lng.toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button type="submit" className="create-submit-button">
                  모임 생성하기
                </button>

                {submitPreview && (
                  <div className="create-submit-preview">
                    <p className="create-submit-preview-title">서버로 보낼 payload 예시</p>
                    <pre>{submitPreview}</pre>
                  </div>
                )}
              </form>
            </APIProvider>
          ) : (
            <form className="create-form-card" onSubmit={handleSubmit}>
              <div className="create-form-grid">
                <div className="create-form-left">
                  <div className="create-form-group">
                    <label htmlFor="meetingName">모임 이름</label>
                    <input
                      id="meetingName"
                      type="text"
                      placeholder="예: 3학년 팀플 회의"
                      value={meetingName}
                      onChange={(event) => {
                        setMeetingName(event.target.value);
                        if (errors.meetingName) {
                          setErrors((prev) => ({ ...prev, meetingName: "" }));
                        }
                      }}
                    />
                    {errors.meetingName && (
                      <p className="create-error-text">{errors.meetingName}</p>
                    )}
                  </div>

                  <div className="create-form-group">
                    <label htmlFor="deadline">투표 마감 일시</label>
                    <input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(event) => {
                        setDeadline(event.target.value);
                        if (errors.deadline) {
                          setErrors((prev) => ({ ...prev, deadline: "" }));
                        }
                      }}
                    />
                    {errors.deadline && (
                      <p className="create-error-text">{errors.deadline}</p>
                    )}
                  </div>

                  <div className="create-form-group">
                    <label htmlFor="placeSearchFallback">장소 검색</label>
                    <input
                      id="placeSearchFallback"
                      type="text"
                      placeholder="NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 설정하면 검색이 활성화됩니다."
                      value={searchText}
                      onChange={(event) => {
                        setSearchText(event.target.value);
                        clearPlaceError();
                      }}
                    />
                    {errors.place && <p className="create-error-text">{errors.place}</p>}
                  </div>

                  <div className="create-form-group">
                    <button
                      type="button"
                      className="create-add-place-button"
                      onClick={handleAddPlace}
                    >
                      선택한 장소 후보에 추가
                    </button>
                  </div>

                  <div className="create-form-group">
                    <label>현재 후보 장소</label>
                    {places.length === 0 ? (
                      <p className="create-empty-message">아직 추가된 장소가 없습니다.</p>
                    ) : (
                      <ul className="create-place-list">
                        {places.map((place, index) => (
                          <li key={`${place.name}-${index}`} className="create-place-item">
                            <div className="create-place-info">
                              <strong>{place.name}</strong>
                              <span>
                                {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                              </span>
                              {place.address ? <span>{place.address}</span> : null}
                            </div>

                            <button
                              type="button"
                              className="create-delete-button"
                              onClick={() => handleDeletePlace(index)}
                            >
                              삭제
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors.places && <p className="create-error-text">{errors.places}</p>}
                  </div>
                </div>

                <div className="create-form-right">
                  <div className="create-map-section">
                    <div className="create-map-header">
                      <h2>지도</h2>
                      <p>Google Maps API Key를 설정하면 지도와 자동완성이 활성화됩니다.</p>
                    </div>

                    <div className="create-map-box">
                      <div className="create-map-fallback">
                        <p>지도를 표시하려면 Google Maps API Key가 필요합니다.</p>
                        <p className="create-map-fallback-code">
                          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="create-submit-button">
                모임 생성하기
              </button>

              {submitPreview && (
                <div className="create-submit-preview">
                  <p className="create-submit-preview-title">서버로 보낼 payload 예시</p>
                  <pre>{submitPreview}</pre>
                </div>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}