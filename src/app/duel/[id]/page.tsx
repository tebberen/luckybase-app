import DuelRoomClient from "@/components/DuelRoomClient";

export function generateStaticParams() {
  // For static export, we need to provide the IDs we want to pre-render.
  // In a real app, you might fetch these from a database or use a different routing strategy.
  return [{ id: "1" }, { id: "2" }, { id: "sample" }];
}

export default async function DuelRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DuelRoomClient id={id} />;
}
