import { useEffect, useRef, useState } from "react";
import Topic from "./Topic";

function Module({
  module,
  updateModule,
  deleteModule,
  addTopic,
  updateTopic,
  deleteTopic,
  addLesson,
  updateLesson,
  deleteLesson,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description);

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingDescription) {
      descriptionInputRef.current?.focus();
    }
  }, [editingDescription]);

  const saveTitle = () => {
    updateModule(module.id, "title", title);
    setEditingTitle(false);
  };

  const cancelTitle = () => {
    setTitle(module.title);
    setEditingTitle(false);
  };

  const saveDescription = () => {
    updateModule(
      module.id,
      "description",
      description
    );

    setEditingDescription(false);
  };

  const cancelDescription = () => {
    setDescription(module.description);
    setEditingDescription(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 border-l-4 border-l-[#EC8601] bg-white">
      <div className="px-3 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label={isOpen ? "Collapse module" : "Expand module"}
          >
            <span className="text-base leading-none">
              {isOpen ? "⌄" : "›"}
            </span>
          </button>

          <div className="min-w-0 flex-1">

            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#EC8601]">
              Module
            </p>

            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTitle();
                  if (e.key === "Escape") cancelTitle();
                }}
                className="w-full rounded-md border border-[#EC8601] bg-white px-2 py-1 text-base font-semibold text-gray-900 outline-none"
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                className="cursor-text text-base font-semibold text-gray-900 hover:text-[#EC8601]"
              >
                {module.title || "Untitled Module"}
              </h2>
            )}

            {editingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveDescription();
                  }

                  if (e.key === "Escape") {
                    cancelDescription();
                  }
                }}
                placeholder="Add module description..."
                rows={2}
                className="mt-1.5 w-full resize-none rounded-md border border-[#EC8601] px-2 py-1.5 text-sm outline-none"
              />
            ) : (
              <p
                onClick={() => setEditingDescription(true)}
                className="mt-1.5 cursor-text text-sm text-gray-400 transition hover:text-gray-600"
              >
                {module.description || "Click to Add Description"}
              </p>
            )}
          </div>

          <button
            onClick={() => deleteModule(module.id)}
            className="shrink-0 self-start rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-3 pb-4 pl-8 sm:px-5 sm:pb-5 sm:pl-12">

          {module.topics.length > 0 && (
            <div className="space-y-3">
              {module.topics.map((topic) => (
                <Topic
                  key={topic.id}
                  topic={topic}
                  moduleId={module.id}
                  updateTopic={updateTopic}
                  deleteTopic={deleteTopic}
                  addLesson={addLesson}
                  updateLesson={updateLesson}
                  deleteLesson={deleteLesson}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => addTopic(module.id)}
            className="mt-3 rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-[#EC8601] hover:text-[#EC8601]"
          >
            + Add Topic
          </button>

        </div>
      )}
    </div>
  );
}

export default Module;