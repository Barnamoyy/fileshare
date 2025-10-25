"use client";
import { useSession } from "next-auth/react";
export default function DashboardPage() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>;
  }
  return <div>Dashboard</div>;
}
