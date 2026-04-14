"use client";

import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";

type SelectedPlace = {
  name: string;
  lat: number;
  lng: number;
};

type Props = {
  onPlaceSelect: (place: SelectedPlace) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
};

export default function PlaceSearchInput({
  onPlaceSelect,
  onTextChange,
  placeholder = "장소 검색",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onTextChangeRef = useRef(onTextChange);

  const placesLibrary = useMapsLibrary("places");

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  }, [onTextChange]);

  useEffect(() => {
    if (!placesLibrary || !inputRef.current || !window.google?.maps?.places) {
      return;
    }

    if (autocompleteRef.current) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        fields: ["name", "geometry", "formatted_address"],
      },
    );

    autocompleteRef.current = autocomplete;

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place?.geometry?.location) {
        return;
      }

      const selectedPlace = {
        name: place.name || place.formatted_address || "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      if (inputRef.current) {
        inputRef.current.value = selectedPlace.name;
      }

      onTextChangeRef.current?.(selectedPlace.name);
      onPlaceSelectRef.current(selectedPlace);
    });

    return () => {
      window.google.maps.event.removeListener(listener);
      autocompleteRef.current = null;
    };
  }, [placesLibrary]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      onChange={(event) => {
        onTextChangeRef.current?.(event.target.value);
      }}
    />
  );
}
