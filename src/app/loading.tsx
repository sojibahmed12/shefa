export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-shefa-200 border-t-shefa-600" />
        <p className="mt-4 text-sm text-shefa-500">Loading...</p>
      </div>
    </div>
  );
}
