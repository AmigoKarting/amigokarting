export function Spinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const spinner = (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{spinner}</div>;
  }

  return spinner;
}
