import { StateBlock } from "@/components/ui";
import { protectedRecoveryUiCopy as copy } from "@/lib/ui-copy";

export default function ProtectedLoading() {
  return (
    <main className="min-h-screen bg-kmt-canvas px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl" aria-live="polite" aria-busy="true">
        <StateBlock tone="loading" title={copy.loadingTitle} description={copy.loadingDescription} />
      </div>
    </main>
  );
}
