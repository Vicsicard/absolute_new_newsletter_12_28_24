export default function LoadingModal() {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-8 bg-white w-96 max-w-lg mx-auto rounded-lg shadow-xl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Setting Up Your Newsletter</h3>
          <p className="text-sm text-gray-500">Please wait while we process your information...</p>
        </div>
      </div>
    </div>
  );
}
