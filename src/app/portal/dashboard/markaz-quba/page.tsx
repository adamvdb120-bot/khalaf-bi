import { requireClientAccess } from "@/lib/portal/access";
import MarkazQubaView from "./MarkazQubaView";
import { CLIENTS } from "@/lib/clients/config";

export default async function MarkazQubaDashboard() {
  const user = await requireClientAccess("quba");
  return (
    <MarkazQubaView
      isAdmin={user.role === "admin"}
      features={CLIENTS.quba.features}
    />
  );
}
