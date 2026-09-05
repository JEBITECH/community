import { EventDetailView } from "./EventDetailView";

/**
 * Event detail route. Params are async in the Next.js App Router, so the id is
 * awaited here and handed to the client view that does the data fetching.
 */
export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventDetailView eventId={id} />;
}
