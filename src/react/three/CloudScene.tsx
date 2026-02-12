import { Suspense, lazy, useState, useEffect } from 'react';

function canRun3D(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Low-end device check
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
  // WebGL check
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

const CloudCanvas = lazy(() => import('./CloudCanvas'));

export function CloudScene() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(canRun3D());
  }, []);

  if (!enabled) return null;

  return (
    <Suspense fallback={null}>
      <CloudCanvas />
    </Suspense>
  );
}
