"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  VideoTrack,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { getLiveKitToken } from "@/actions/meeting-actions";

/* ---------------- ROOM GRID ---------------- */

function RoomGrid() {
  const participants = useParticipants();

  return (
    <div className="grid h-full grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {participants.map((p) => (
        <div
          key={p.identity}
          className="relative overflow-hidden rounded-xl border border-(--border-base) bg-black"
        >
          {/* VIDEO */}
          <VideoTrack
            participant={p}
            source={Track.Source.Camera}
            className="h-full w-full object-cover"
          />

          {/* NAME TAG */}
          <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
            {p.name || p.identity}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */

type LiveKitRoomClientProps = {
  currentUserName: string;
  activeRoomName: string | null;
  onLeave: () => void;
};

export default function LiveKitRoomClient({
  currentUserName,
  activeRoomName,
  onLeave,
}: LiveKitRoomClientProps) {
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const liveKitUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "").trim(),
    [],
  );

  const leaveRoom = () => {
    setToken(null);
    setError(null);
    setStatusMessage("Disconnected.");
    onLeave();
  };

  useEffect(() => {
    if (!activeRoomName) {
      setToken(null);
      setStatusMessage("Select a room to join.");
      return;
    }

    let cancelled = false;

    async function connect() {
      setIsConnecting(true);
      setError(null);
      setStatusMessage(`Joining ${activeRoomName}...`);

      try {
        const { token } = await getLiveKitToken(
          activeRoomName,
          currentUserName,
        );

        if (!cancelled) {
          setToken(token);
          setStatusMessage(`Connected as ${currentUserName}`);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Failed to connect to room.");
          setToken(null);
        }
      } finally {
        if (!cancelled) setIsConnecting(false);
      }
    }

    connect();

    return () => {
      cancelled = true;
    };
  }, [activeRoomName, currentUserName]);

  /* ---------------- UI ---------------- */

  if (!activeRoomName) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-(--border-base)">
        <p className="text-sm text-gray-400">
          Choose a room to join a live session
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between rounded-xl border border-(--border-base) p-4">
        <div>
          <p className="text-xs text-gray-400">Active Room</p>
          <p className="text-lg font-semibold text-white">
            {activeRoomName}
          </p>
        </div>

        <button
          onClick={leaveRoom}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Leave Room
        </button>
      </div>

      {/* CONTENT */}
      {token ? (
        <div className="h-[75vh] overflow-hidden rounded-2xl border border-(--border-base) bg-black">
          <LiveKitRoom
            token={token}
            serverUrl={liveKitUrl}
            connect
            video
            audio
            className="h-full"
            onDisconnected={leaveRoom}
            onError={(e) => setError(e.message)}
          >
            <RoomGrid />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      ) : (
        <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-(--border-base)">
          <p className="text-sm text-gray-400">
            {isConnecting ? "Connecting..." : "Preparing room..."}
          </p>
        </div>
      )}

      {/* STATUS */}
      {statusMessage && (
        <p className="text-sm text-emerald-300">{statusMessage}</p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}