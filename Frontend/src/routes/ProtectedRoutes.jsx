import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // dummy auth (replace later with real auth)
  const isAuthenticated = true; // change to false to test

  return isAuthenticated ? <Outlet/>: <Navigate to="/login" />;
}