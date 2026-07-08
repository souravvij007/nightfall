import { redirect } from "next/navigation";

// Voice was folded into server voice channels (Phase 2). The standalone rooms
// list is retired; send visitors to their servers. Individual legacy room pages
// (/rooms/[roomId]) still render for any pre-existing rooms.
export default function RoomsPage() {
  redirect("/servers");
}
