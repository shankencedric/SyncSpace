"use client";

import { FormEvent, useMemo, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";

type TokenResponse = {
  token?: string;
  detail?: string;
};

type StartRecordingResponse = {
  status?: string;
  egress_id?: string;
  detail?: string;
};

type StopRecordingResponse = {
  status?: string;
  egress_id?: string;
  detail?: string;
};

type RecordingState = "idle" | "starting" | "recording" | "stopping";

const DEFAULT_ROOM = "virtualoffice-demo";

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export default function LiveKitRoomClient() {
  const [roomName, setRoomName] = useState(DEFAULT_ROOM);
  const [participantName, setParticipantName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [activeEgressId, setActiveEgressId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const liveKitUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "").trim(),
    [],
  );
  const tokenApiBase = useMemo(
    () => normalizeUrl((process.env.NEXT_PUBLIC_TOKEN_API_URL ?? "http://localhost:8000").trim()),
    [],
  );

  const leaveRoom = () => {
    setToken(null);
    setRecordingState("idle");
    setActiveEgressId(null);
    setStatusMessage("Disconnected from room.");
    setError(null);
  };

  async function startRecording() {
    const trimmedRoom = roomName.trim();
    const trimmedMeetingId = meetingId.trim();
    if (!trimmedRoom) {
      setError("Room is required to start recording.");
      return;
    }
    if (!trimmedMeetingId) {
      setError("Meeting ID is required to start recording.");
      return;
    }

    try {
      setRecordingState("starting");
      setError(null);
      setStatusMessage("Starting recording...");

      const response = await fetch(`${tokenApiBase}/api/recordings/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_name: trimmedRoom,
          meeting_id: trimmedMeetingId,
        }),
      });

      let payload: StartRecordingResponse = {};
      try {
        payload = (await response.json()) as StartRecordingResponse;
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(payload.detail ?? "Failed to start room recording.");
      }
      if (!payload.egress_id) {
        throw new Error("Recording start succeeded but egress_id was missing.");
      }

      setActiveEgressId(payload.egress_id);
      setRecordingState("recording");
      setStatusMessage("Recording is active.");
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : "Could not start recording.";
      setRecordingState("idle");
      setActiveEgressId(null);
      setError(message);
      setStatusMessage(null);
    }
  }

  async function stopRecording() {
    if (!activeEgressId) {
      setError("No active recording to stop.");
      return;
    }

    try {
      setRecordingState("stopping");
      setError(null);
      setStatusMessage("Stopping recording...");

      const response = await fetch(`${tokenApiBase}/api/recordings/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ egress_id: activeEgressId }),
      });

      let payload: StopRecordingResponse = {};
      try {
        payload = (await response.json()) as StopRecordingResponse;
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(payload.detail ?? "Failed to stop room recording.");
      }

      setRecordingState("idle");
      setActiveEgressId(null);
      setStatusMessage("Recording stopped. Processing will continue in the backend.");
    } catch (stopError) {
      const message = stopError instanceof Error ? stopError.message : "Could not stop recording.";
      setRecordingState("recording");
      setError(message);
      setStatusMessage(null);
    }
  }

  async function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = participantName.trim();
    const trimmedRoom = roomName.trim();

    if (!trimmedName || !trimmedRoom) {
      setError("Participant name and room are required.");
      return;
    }

    if (!liveKitUrl) {
      setError("Missing NEXT_PUBLIC_LIVEKIT_URL in env.local.");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setStatusMessage("Requesting access token...");

      const response = await fetch(
        `${tokenApiBase}/get-token?room_name=${encodeURIComponent(trimmedRoom)}&participant_name=${encodeURIComponent(trimmedName)}`,
      );

      let payload: TokenResponse = {};
      try {
        payload = (await response.json()) as TokenResponse;
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(payload.detail ?? "Failed to request a LiveKit token.");
      }

      if (!payload.token) {
        throw new Error("Token API returned no token.");
      }

      setToken(payload.token);
      setStatusMessage(`Connected as ${trimmedName} in ${trimmedRoom}.`);
    } catch (connectError) {
      const message =
        connectError instanceof Error ? connectError.message : "Could not connect to LiveKit.";
      setError(message);
      setStatusMessage(null);
      setToken(null);
    } finally {
      setIsConnecting(false);
    }
  }

  return (
    <main className="vo-shell vo-grid min-h-screen px-5 pb-10 pt-24 sm:px-8">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="vo-card rounded-2xl p-6">
          <p className="font-(--font-ui-mono) text-xs uppercase tracking-[0.2em] text-(--accent)">
            LiveKit WebRTC
          </p>
          <h1 className="mt-2 font-(--font-serif) text-4xl leading-tight tracking-[-0.03em] text-white">
            Join a real-time room
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-(--text-secondary)">
            Connect your camera and microphone using LiveKit with JWT tokens from your FastAPI
            backend.
          </p>
        </header>

        {!token ? (
          <form onSubmit={joinRoom} className="vo-card grid gap-5 rounded-2xl p-6 md:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-(--text-secondary)">Room</span>
              <input
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                className="h-11 w-full rounded-xl border border-(--border-base) bg-[rgba(15,23,42,0.45)] px-4 text-sm text-white focus:border-(--accent) focus:outline-none"
                placeholder="virtualoffice-demo"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-(--text-secondary)">
                Participant name
              </span>
              <input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                className="h-11 w-full rounded-xl border border-(--border-base) bg-[rgba(15,23,42,0.45)] px-4 text-sm text-white focus:border-(--accent) focus:outline-none"
                placeholder="Juan Dela Cruz"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-(--text-secondary)">Meeting ID</span>
              <input
                value={meetingId}
                onChange={(event) => setMeetingId(event.target.value)}
                className="h-11 w-full rounded-xl border border-(--border-base) bg-[rgba(15,23,42,0.45)] px-4 text-sm text-white focus:border-(--accent) focus:outline-none"
                placeholder="UUID from meetings.id"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isConnecting}
                className="vo-button-primary h-11 w-full rounded-xl font-(--font-brand) text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isConnecting ? "Connecting..." : "Join room"}
              </button>
            </div>
          </form>
        ) : (
          <section className="space-y-4">
            <div className="vo-card flex items-center justify-between gap-4 rounded-2xl p-4">
              <p className="text-sm text-(--text-secondary)">
                Camera and microphone are enabled. Ask a teammate to join the same room to test
                remote streams.
              </p>
              <div className="flex items-center gap-2">
                {recordingState !== "recording" ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={recordingState === "starting" || recordingState === "stopping"}
                    className="rounded-lg border border-rose-400/60 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-900/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {recordingState === "starting" ? "Starting..." : "Start Recording"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    disabled={recordingState === "stopping" as RecordingState}
                    className="rounded-lg border border-amber-300/60 px-4 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-900/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {recordingState === "stopping" as RecordingState ? "Stopping..." : "Stop Recording"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="rounded-lg border border-(--border-base) px-4 py-2 text-sm font-semibold text-(--text-secondary) hover:bg-[rgba(7,57,60,0.25)] hover:text-white"
                >
                  Leave room
                </button>
              </div>
            </div>

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
                  setRecordingState("idle");
                  setActiveEgressId(null);
                  setStatusMessage("Disconnected from room.");
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
          </section>
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
    </main>
  );
}
