"use client";

export interface CanvasUser {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
}

const GRID_SIZE = 10;

type SpatialCanvasProps = {
  users: CanvasUser[];
  currentUserId: string;
  onAvatarClick: (targetUser: CanvasUser) => void;
};

export default function SpatialCanvas({ users, currentUserId, onAvatarClick }: SpatialCanvasProps) {
  function handleAvatarClick(targetUser: CanvasUser) {
    onAvatarClick(targetUser);
  }

  return (
    <section className="vo-card rounded-2xl p-5">
      <header className="mb-4">
        <p className="font-(--font-ui-mono) text-xs uppercase tracking-[0.2em] text-(--accent)">
          Office Zones
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">Spatial Canvas</h2>
      </header>

      <div
        className="relative grid aspect-square w-full max-w-3xl rounded-2xl border border-(--border-base) bg-[rgba(15,23,42,0.5)]"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => (
          <div
            key={`cell-${index}`}
            className="border border-[rgba(148,163,184,0.12)] odd:bg-[rgba(51,65,85,0.08)]"
          />
        ))}

        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => handleAvatarClick(user)}
              className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/70 text-xs font-bold text-white shadow-lg transition hover:scale-110 hover:ring-4 hover:ring-cyan-300/40 ${user.color} ${
                isCurrentUser ? "ring-4 ring-emerald-300/60" : ""
              }`}
              style={{
                left: `${((user.x + 0.5) / GRID_SIZE) * 100}%`,
                top: `${((user.y + 0.5) / GRID_SIZE) * 100}%`,
              }}
              title={`${isCurrentUser ? "You" : "Join"}: ${user.name} (room_user_${user.id})`}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-(--text-secondary)">
        Click an avatar to jump into that user&apos;s bubble room.
      </p>
    </section>
  );
}
