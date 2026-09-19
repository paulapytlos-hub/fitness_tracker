import { Page } from "@/components/Page";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <Page
      title="Szczegóły treningu"
      description={`Sesja ${sessionId} — implementacja w STEP 6.`}
    >
      <div />
    </Page>
  );
}
