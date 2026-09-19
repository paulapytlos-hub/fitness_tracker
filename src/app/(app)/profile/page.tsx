import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Page } from "@/components/Page";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, created_at")
    .eq("id", user.id)
    .single();

  return (
    <Page
      eyebrow="Personal space"
      title="Profile"
      description="Your details and training preferences."
    >
      <div className="max-w-md space-y-6">
        {profile ? (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-line py-2">
              <dt className="text-muted-foreground">Imię</dt>
              <dd>{profile.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-line py-2">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd>{profile.email}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Konto utworzone</dt>
              <dd>
                {new Date(profile.created_at).toLocaleDateString("pl-PL")}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nie udało się załadować profilu.
          </p>
        )}

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-md border border-line px-4 py-2 text-sm hover:border-primary/40"
          >
            Wyloguj się
          </button>
        </form>
      </div>
    </Page>
  );
}
