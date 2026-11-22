import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { Card } from "@/components/ui/card";
import { requirePageUser } from "@/lib/auth/session";
import { AccountForm } from "./account-form";
import { strings } from "@/strings/en";

export default async function AccountPage() {
  const { supabase, user } = await requirePageUser("/account");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-ivory text-ink pb-24">
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
        <div className="rounded-2xl bg-forest-deep px-5 py-4 text-white shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">{strings.account.title}</h1>
        </div>
        <Card>
          <AccountForm
            email={profile?.email ?? user.email ?? ""}
            initialFullName={profile?.full_name ?? ""}
            initialPhone={profile?.phone ?? ""}
          />
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
