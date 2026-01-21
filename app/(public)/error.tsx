"use client";

import { ErrorState } from '@/components/ui/Status/Status';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <ErrorState title="No se pudo cargar la página" description={error.message} onRetry={reset} />
    </main>
  );
}
