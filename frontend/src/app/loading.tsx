import { LoadingState } from "@/components/layout/LoadingState";

export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <LoadingState variant="page" />
    </div>
  );
}
