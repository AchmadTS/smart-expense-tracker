import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/topbar/Topbar";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "@/schemas/schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
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

  if (!token) {
    redirect("/login");
  }

  let currentUser = null;

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is missing");
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (userId) {
      const [result] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (result) {
        currentUser = result;
      }
    }
  } catch {
    redirect("/api/auth/logout");
  }

  if (!currentUser) {
    redirect("/api/auth/logout");
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={currentUser} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={currentUser} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
