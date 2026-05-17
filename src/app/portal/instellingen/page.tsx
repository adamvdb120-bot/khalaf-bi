import { requireDashboardAccess } from "@/lib/portal/access";
import InstellingenView from "./InstellingenView";

export default async function InstellingenPage() {
  await requireDashboardAccess();
  return <InstellingenView />;
}
