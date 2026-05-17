import { requireDashboardAccess } from "@/lib/portal/access";
import DataUploadenView from "./DataUploadenView";

export default async function DataUploadenPage() {
  await requireDashboardAccess();
  return <DataUploadenView />;
}
