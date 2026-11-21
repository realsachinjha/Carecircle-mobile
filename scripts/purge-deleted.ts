import { createClient } from "@supabase/supabase-js";

const BUCKET = "medical-documents";
const BATCH = 100;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function main() {
  const supabase = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: candidates, error } = await supabase.rpc("purge_candidates");
  if (error) {
    throw new Error(`purge_candidates failed: ${error.code}`);
  }
  const paths = (candidates ?? []).map((row: { path: string }) => row.path);
  for (let start = 0; start < paths.length; start += BATCH) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths.slice(start, start + BATCH));
    if (removeError) {
      throw new Error(`storage remove failed at batch ${start / BATCH}`);
    }
  }
  const { data: finished, error: finishError } = await supabase.rpc("purge_finish");
  if (finishError) {
    throw new Error(`purge_finish failed: ${finishError.code}`);
  }
  console.log(JSON.stringify({ filesRemoved: paths.length, ...(finished as object) }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "purge failed");
  process.exit(1);
});
