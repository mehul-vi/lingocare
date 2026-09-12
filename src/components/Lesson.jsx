import { useEffect, useRef, useState } from "react";

function Lesson({
  lesson,
  moduleId,
  topicId,
  updateLesson,
  deleteLesson,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] =
    useState(false);

  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(
    lesson.description
  );

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // Focus title input
  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
    }
  }, [editingTitle]);

  // Focus description input
  useEffect(() => {
    if (editingDescription) {
      descriptionInputRef.current?.focus();
    }
  }, [editingDescription]);

  // Save title
  const saveTitle = () => {
    updateLesson(
      moduleId,
      topicId,
      lesson.id,
      "title",
      title
    );

    setEditingTitle(false);
  };

  // Cancel title
  const cancelTitle = () => {
    setTitle(lesson.title);
    setEditingTitle(false);
  };

  // Save description
  const saveDescription = () => {
    updateLesson(
      moduleId,
      topicId,
      lesson.id,
      "description",
      description
    );

    setEditingDescription(false);
  };

  // Cancel description
  const cancelDescription = () => {
    setDescription(lesson.description);
    setEditingDescription(false);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">

      {/* Lesson Header */}
      <div className="px-3 py-3 sm:px-3.5">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

          {/* Expand / Collapse */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
            aria-label={
              isOpen
                ? "Collapse lesson"
                : "Expand lesson"
            }
          >
            <span className="text-base leading-none">
              {isOpen ? "⌄" : "›"}
            </span>
          </button>

          {/* Lesson Content */}
          <div className="min-w-0 flex-1">

            {/* Label */}
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Lesson
            </p>

            {/* Title */}
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveTitle();
                  }

                  if (e.key === "Escape") {
                    cancelTitle();
                  }
                }}
                className="w-full rounded-md border border-[#EC8601] bg-white px-2 py-1 text-sm font-medium text-gray-900 outline-none"
              />
            ) : (
              <p
                onClick={() =>
                  setEditingTitle(true)
                }
                className="cursor-text text-sm font-medium text-gray-900 transition hover:text-[#EC8601]"
              >
                {lesson.title ||
                  "Untitled Lesson"}
              </p>
            )}

            {/* Description */}
            {editingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                onBlur={saveDescription}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    saveDescription();
                  }

                  if (e.key === "Escape") {
                    cancelDescription();
                  }
                }}
                placeholder="Add lesson description..."
                rows={2}
                className="mt-1.5 w-full resize-none rounded-md border border-[#EC8601] bg-white px-2 py-1.5 text-xs text-gray-600 outline-none"
              />
            ) : (
              <p
                onClick={() =>
                  setEditingDescription(true)
                }
                className="mt-1.5 cursor-text text-xs text-gray-400 transition hover:text-gray-600"
              >
                {lesson.description ||
                  "Click to Add Description"}
              </p>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={() =>
              deleteLesson(
                moduleId,
                topicId,
                lesson.id
              )
            }
            className="shrink-0 self-start rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          >
            Delete
          </button>

        </div>
      </div>

      {/* Lesson Details */}
      {isOpen && (
        <div className="border-t border-gray-100 px-3 py-3 pl-8 sm:px-3.5 sm:pl-12">
          <p className="text-xs text-gray-400">
            Click the title or description to edit.
          </p>
        </div>
      )}

    </div>
  );
}

export default Lesson;