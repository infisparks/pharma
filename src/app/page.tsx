import { TopBar } from "@/components/TopBar";
import { InventoryTable } from "@/components/InventoryTable";
import { OverviewPanel } from "@/components/OverviewPanel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] selection:bg-indigo-100">
      <TopBar />
      <div className="flex-1 flex p-5 lg:p-6 overflow-x-hidden justify-center">
        <InventoryTable />
      </div>
    </div>
  );
}
