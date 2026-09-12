import Upload from "./Upload";

function Header({ onUpload, isGenerating }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Curriculum Creation
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Build and manage your curriculum
          </p>
        </div>

        <Upload
          onUpload={onUpload}
          isGenerating={isGenerating}
        />

      </div>
    </header>
  );
}

export default Header;