function Upload({ onUpload, isGenerating }) {
  return (
    <label
      className={`flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-white transition sm:w-auto ${
        isGenerating
          ? "cursor-not-allowed bg-gray-400"
          : "cursor-pointer bg-[#EC8601] hover:bg-[#d97700]"
      }`}
    >
      {isGenerating
        ? "Generating..."
        : "Upload Curriculum"}

      <input
        type="file"
        accept=".pdf"
        onChange={onUpload}
        disabled={isGenerating}
        className="hidden"
      />
    </label>
  );
}

export default Upload;