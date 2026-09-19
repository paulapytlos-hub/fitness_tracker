import { Page } from "@/components/Page";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <Page
      title="Trening w toku"
      description={`Sesja ${sessionId} — wpisywanie serii, implementacja w STEP 6.`}
    >
      <div />
    </Page>
  );
}
