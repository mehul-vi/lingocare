import Upload from "./Upload";

function Header({ onUpload, isGenerating }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">

        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Curriculum Creation
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Build and manage your curriculum
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <Upload
            onUpload={onUpload}
            isGenerating={isGenerating}
          />
        </div>

      </div>
    </header>
  );
}

export default Header;