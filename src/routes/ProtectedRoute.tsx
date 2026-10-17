import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasSession } from "@/lib/auth";

export default function ProtectedRoute() {
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
