import { Page } from "../components/shell/AppShell";
import CardSkeleton from "../components/CardSkeleton";

export default function Loading() {
  return (
    <Page>
      <div className="mb-6 h-8 w-40 animate-pulse rounded-lg bg-panel-2" />
      <CardSkeleton />
    </Page>
  );
}
