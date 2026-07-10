import { ButtonLink, StateBlock } from "@/components/ui";
import { protectedRecoveryUiCopy as copy } from "@/lib/ui-copy";

export default function ProtectedNotFound() {
  return (
    <main className="min-h-screen bg-kmt-canvas px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <StateBlock tone="empty" title={copy.notFoundTitle} description={copy.notFoundDescription} />
        <ButtonLink className="mt-4" href="/admin">
          {copy.backToDashboard}
        </ButtonLink>
      </div>
    </main>
  );
}
