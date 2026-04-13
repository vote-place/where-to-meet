"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

type SelectedPlace = {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
};

type PlaceSearchInputProps = {
  value: string;
  onValueChange: (text: string) => void;
  onPlaceSelect: (place: SelectedPlace) => void;
  placeholder?: string;
};

export default function PlaceSearchInput({
  value,
  onValueChange,
  onPlaceSelect,
  placeholder = "장소 검색",
}: PlaceSearchInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const placesLibrary = useMapsLibrary("places");

  useEffect(() => {
    if (!inputRef.current) return;

    if (inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  useEffect(() => {
    if (!placesLibrary || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ["name", "geometry", "formatted_address", "place_id"],
      }
    );

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place?.geometry?.location) {
        return;
      }

      const selectedPlace: SelectedPlace = {
        name: place.name || place.formatted_address || "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || "",
        placeId: place.place_id || "",
      };

      onValueChange(selectedPlace.name);
      onPlaceSelect(selectedPlace);
    });

    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [placesLibrary, onPlaceSelect, onValueChange]);

  return (
    <input
      ref={inputRef}
      id="placeSearch"
      type="text"
      placeholder={placeholder}
      defaultValue={value}
      onChange={(event) => onValueChange(event.target.value)}
    />
  );
}