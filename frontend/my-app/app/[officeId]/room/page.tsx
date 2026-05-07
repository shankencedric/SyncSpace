import { getOfficeSpatialUsers } from "@/actions/office-actions";
import type { CanvasUser } from "@/app/components/canvas/SpatialCanvas";
import SpatialRoomShell from "@/app/components/room/SpatialRoomShell";

const AVATAR_COLORS = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
] as const;

const GRID_SIZE = 10;

type OfficeSpatialRoomPageProps = {
  params: Promise<{
    officeId: string;
  }>;
};

function mapUsersToCanvas(users: Array<{ id: string; name: string }>): CanvasUser[] {
  return users.map((user, index) => {
    const column = index % GRID_SIZE;
    const row = Math.floor(index / GRID_SIZE) % GRID_SIZE;
    return {
      id: user.id,
      name: user.name,
      x: column,
      y: row,
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    };
  });
}

export default async function OfficeSpatialRoomPage({ params }: OfficeSpatialRoomPageProps) {
  const { officeId } = await params;
  const { currentUser, users } = await getOfficeSpatialUsers(officeId);
  const canvasUsers = mapUsersToCanvas(users);

  return <SpatialRoomShell currentUser={currentUser} users={canvasUsers} />;
}
