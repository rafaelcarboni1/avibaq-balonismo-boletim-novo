import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "@/hooks/useUser";

export function ProtectedRoute({ allowedRoles, children }) {
  const router = useRouter();
  const { user, role, loading } = useUser();

  useEffect(() => {
    if (!loading && role !== null) {
      if (!user || !allowedRoles.includes(role)) {
        router.replace("/login");
      }
    }
  }, [user, role, loading, allowedRoles, router]);

  if (loading || !user || role === null) return null;
  return children;
} 