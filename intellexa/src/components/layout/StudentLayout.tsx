import { Outlet } from "react-router-dom";
import StudentSidebar from "./StudentSidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function StudentLayout() {
  return (
    <div className="flex min-h-dvh bg-void-100">
      <StudentSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 px-4 sm:px-6 py-5 sm:py-8 pb-24 lg:pb-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
