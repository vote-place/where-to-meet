"use client";

import { APIProvider } from "@vis.gl/react-google-maps";

type Props = {
  children: React.ReactNode;
};

export default function GoogleMapsProvider({ children }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]} region="KR">
      {children}
    </APIProvider>
  );
}
