import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let currentUser = null;

  if (token) {
    try {
      const secret = process.env.JWT_SECRET || "super-secret-auth-key";
      const decoded = jwt.verify(token, secret) as { userId?: number | string };

      if (decoded?.userId) {
        const userIdNum =
          typeof decoded.userId === "string"
            ? parseInt(decoded.userId, 10)
            : decoded.userId;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.id, userIdNum))
          .limit(1);

        if (result.length > 0) {
          currentUser = result[0];
        }
      }
    } catch {
      redirect("/api/auth/clear-cookie");
    }
  } else {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={currentUser} />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
