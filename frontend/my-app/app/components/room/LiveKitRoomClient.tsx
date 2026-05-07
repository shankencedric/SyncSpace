"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import { getLiveKitToken } from "@/actions/meeting-actions";

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
    setStatusMessage("Disconnected from room.");
    setError(null);
    onLeave();
  };

  useEffect(() => {
    if (!activeRoomName) {
      setToken(null);
      setError(null);
      setStatusMessage("Select an avatar to join a bubble room.");
      return;
    }
    let isCancelled = false;

    async function connectToActiveRoom() {
      if (!liveKitUrl) {
        setError("Missing NEXT_PUBLIC_LIVEKIT_URL in env.local.");
        return;
      }

      if (!activeRoomName) {
        setError("Room name is required.");
        return;
      }

      setIsConnecting(true);
      setError(null);
      setStatusMessage(`Connecting to ${activeRoomName}...`);

      try {
        const payload = await getLiveKitToken(activeRoomName, currentUserName);
        if (isCancelled) {
          return;
        }
        setToken(payload.token);
        setStatusMessage(`Connected as ${currentUserName} in ${activeRoomName}.`);
      } catch (connectError) {
        if (isCancelled) {
          return;
        }
        const message =
          connectError instanceof Error ? connectError.message : "Could not connect to LiveKit.";
        setError(message);
        setStatusMessage(null);
        setToken(null);
      } finally {
        if (!isCancelled) {
          setIsConnecting(false);
        }
      }
    }

    void connectToActiveRoom();

    return () => {
      isCancelled = true;
    };
  }, [activeRoomName, currentUserName, liveKitUrl]);

  if (!activeRoomName) {
    return (
      <section className="vo-card flex min-h-[420px] items-center justify-center rounded-2xl p-6">
        <p className="text-sm text-(--text-secondary)">
          Select a teammate avatar to join their bubble.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="vo-card flex items-center justify-between gap-4 rounded-2xl p-4">
        <p className="text-sm text-(--text-secondary)">
          Active bubble: <span className="font-semibold text-white">{activeRoomName}</span>
        </p>
        <button
          type="button"
          onClick={leaveRoom}
          className="rounded-lg border border-(--border-base) px-4 py-2 text-sm font-semibold text-(--text-secondary) hover:bg-[rgba(7,57,60,0.25)] hover:text-white"
        >
          Leave Bubble
        </button>
      </div>

      {token ? (
        <div className="overflow-hidden rounded-2xl border border-(--border-base)">
          <LiveKitRoom
            token={token}
            serverUrl={liveKitUrl}
            connect={true}
            video={true}
            audio={true}
            onMediaDeviceFailure={(deviceFailure) => {
              setError(`Media device error: ${deviceFailure}`);
            }}
            onDisconnected={() => {
              setToken(null);
              setStatusMessage("Disconnected from room.");
              onLeave();
            }}
            onError={(liveKitError) => {
              setError(liveKitError.message);
            }}
            className="h-[70vh]"
          >
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      ) : (
        <div className="vo-card flex min-h-[420px] items-center justify-center rounded-2xl p-6">
          <p className="text-sm text-(--text-secondary)">
            {isConnecting ? "Connecting to bubble..." : "Waiting for connection..."}
          </p>
        </div>
      )}

      {statusMessage ? (
        <p className="text-sm font-medium text-emerald-300" role="status">
          {statusMessage}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
