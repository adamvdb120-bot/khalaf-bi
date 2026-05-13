import { requireClientAccess } from "@/lib/portal/access";
import MarkazQubaView from "./MarkazQubaView";

export default async function MarkazQubaDashboard() {
  const user = await requireClientAccess("quba");
  return <MarkazQubaView isAdmin={user.role === "admin"} />;
}
