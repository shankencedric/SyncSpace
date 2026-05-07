"use client";

import { useState } from "react";
import SpatialCanvas, { CanvasUser } from "@/app/components/canvas/SpatialCanvas";
import LiveKitRoomClient from "@/app/components/room/LiveKitRoomClient";

const CURRENT_USER = {
  id: "u1",
  name: "Alice",
};

export default function OfficeSpatialRoomPage() {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const handleAvatarClick = (targetUser: CanvasUser) => {
    setActiveRoom(`room_user_${targetUser.id}`);
  };

  return (
    <main className="vo-shell vo-grid min-h-screen px-5 pb-10 pt-24 sm:px-8">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.1fr_1fr]">
        <SpatialCanvas currentUserId={CURRENT_USER.id} onAvatarClick={handleAvatarClick} />
        <LiveKitRoomClient
          currentUserName={CURRENT_USER.name}
          activeRoomName={activeRoom}
          onLeave={() => setActiveRoom(null)}
        />
      </section>
    </main>
  );
}
