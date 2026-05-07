"use client";

import { useEffect, useMemo, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import { getLiveKitToken } from "@/actions/meeting-actions";

// CRITICAL FIX: This imports the pre-built CSS for grids, name tags, and buttons.
import "@livekit/components-styles";

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
    []
  );

  const leaveRoom = () => {
    setToken(null);
    setStatusMessage("Disconnected from room.");
    setError(null);
    onLeave();
  };

  useEffect(() => {
    if (activeRoomName === null) {
      setToken(null);
      setError(null);
      setStatusMessage("Select a teammate to join their workspace.");
      return;
    }

    const roomName = activeRoomName;
    let isCancelled = false;

    async function connectToActiveRoom(room: string, participantName: string) {
      if (!liveKitUrl) {
        setError("Missing NEXT_PUBLIC_LIVEKIT_URL in env.local.");
        return;
      }

      setIsConnecting(true);
      setError(null);
      setStatusMessage(`Connecting to ${room}...`);

      try {
        const payload = await getLiveKitToken(room, participantName);
        if (isCancelled) return;
        
        setToken(payload.token);
        setStatusMessage(`Connected as ${participantName} in ${room}.`);
      } catch (connectError) {
        if (isCancelled) return;
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

    void connectToActiveRoom(roomName, currentUserName);

    return () => {
      isCancelled = true;
    };
  }, [activeRoomName, currentUserName, liveKitUrl]);

  // Removed the empty box placeholder. If no room, just render nothing, 
  // or a very sleek prompt depending on your layout.
  if (!activeRoomName) {
    return null; 
  }

  return (
    <section className="flex flex-col w-full h-full space-y-4">
      {/* Header / Controls */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[rgba(15,23,42,0.45)] border border-(--border-base) shadow-sm">
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wider text-(--text-secondary) font-semibold">
            Active Workspace
          </p>
          <p className="text-lg font-bold text-white tracking-tight">
            {activeRoomName}
          </p>
        </div>
        <button
          type="button"
          onClick={leaveRoom}
          className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-5 py-2 text-sm font-semibold text-rose-400 transition-colors hover:bg-rose-500 hover:text-white"
        >
          Leave Workspace
        </button>
      </div>

      {/* Video Grid Area */}
      {token ? (
        // Added a dark background and specific height setup so the LiveKit grid can expand
        <div className="flex-1 w-full min-h-[70vh] overflow-hidden rounded-2xl border border-(--border-base) bg-[#0a0a0a] shadow-2xl relative">
          <LiveKitRoom
            token={token}
            serverUrl={liveKitUrl}
            connect={true}
            video={true}
            audio={true}
            data-lk-theme="default" // Applies LiveKit's dark/light standard theme
            className="flex flex-col w-full h-full"
            onMediaDeviceFailure={(deviceFailure) => {
              setError(`Camera/Mic access denied: ${deviceFailure}`);
            }}
            onDisconnected={() => {
              setToken(null);
              setStatusMessage("Disconnected from room.");
              onLeave();
            }}
            onError={(liveKitError) => {
              setError(liveKitError.message);
            }}
          >
            {/* VideoConference automatically handles the grid, speaker spotlight, and control bar */}
            <VideoConference className="w-full h-full" />
            <RoomAudioRenderer />
          </LiveKitRoom>
        </div>
      ) : (
        // Polished Loading State instead of a basic placeholder
        <div className="flex-1 w-full min-h-[70vh] flex flex-col items-center justify-center rounded-2xl border border-(--border-base) bg-[rgba(15,23,42,0.45)]">
          {isConnecting ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-t-(--accent) border-(--border-base) rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-(--text-secondary) animate-pulse">
                Establishing secure connection...
              </p>
            </div>
          ) : (
            <p className="text-sm text-(--text-secondary)">Preparing workspace...</p>
          )}
        </div>
      )}

      {/* Status Toasts */}
      {(statusMessage || error) && (
        <div className="flex justify-center mt-2">
          {error ? (
            <span className="px-4 py-2 text-sm font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {error}
            </span>
          ) : (
            <span className="px-4 py-2 text-sm font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {statusMessage}
            </span>
          )}
        </div>
      )}
    </section>
  );
}