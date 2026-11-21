import { AppHeader } from "@/components/app-header";
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
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-xl flex-col gap-6 p-4">
        <h1 className="text-3xl font-semibold">{strings.account.title}</h1>
        <Card>
          <AccountForm
            email={profile?.email ?? user.email ?? ""}
            initialFullName={profile?.full_name ?? ""}
            initialPhone={profile?.phone ?? ""}
          />
        </Card>
      </main>
    </>
  );
}
