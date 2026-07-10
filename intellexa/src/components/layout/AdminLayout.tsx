import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-dvh bg-void-100">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1500px] w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
