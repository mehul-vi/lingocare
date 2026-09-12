import { useEffect, useRef, useState } from "react";
import Lesson from "./Lesson";

function Topic({
  topic,
  moduleId,
  updateTopic,
  deleteTopic,
  addLesson,
  updateLesson,
  deleteLesson,
}) {
  const [isOpen, setIsOpen] = useState(true);

  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] =
    useState(false);

  const [title, setTitle] = useState(topic.title);
  const [description, setDescription] = useState(
    topic.description
  );

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // --------------------------------
  // Focus title input
  // --------------------------------

  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
    }
  }, [editingTitle]);

  // --------------------------------
  // Focus description input
  // --------------------------------

  useEffect(() => {
    if (editingDescription) {
      descriptionInputRef.current?.focus();
    }
  }, [editingDescription]);

  // --------------------------------
  // Save title
  // --------------------------------

  const saveTitle = () => {
    updateTopic(
      moduleId,
      topic.id,
      "title",
      title
    );

    setEditingTitle(false);
  };

  // --------------------------------
  // Cancel title
  // --------------------------------

  const cancelTitle = () => {
    setTitle(topic.title);
    setEditingTitle(false);
  };

  // --------------------------------
  // Save description
  // --------------------------------

  const saveDescription = () => {
    updateTopic(
      moduleId,
      topic.id,
      "description",
      description
    );

    setEditingDescription(false);
  };

  // --------------------------------
  // Cancel description
  // --------------------------------

  const cancelDescription = () => {
    setDescription(topic.description);
    setEditingDescription(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">

      {/* Topic Header */}

      <div className="px-3 py-3 sm:px-4">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

          {/* Expand / Collapse */}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
            aria-label={
              isOpen
                ? "Collapse topic"
                : "Expand topic"
            }
          >
            <span className="text-base leading-none">
              {isOpen ? "⌄" : "›"}
            </span>
          </button>

          {/* Topic Content */}

          <div className="min-w-0 flex-1">

            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Topic
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
                className="w-full rounded-md border border-[#EC8601] bg-white px-2 py-1 text-sm font-semibold text-gray-900 outline-none"
              />
            ) : (
              <h3
                onClick={() =>
                  setEditingTitle(true)
                }
                className="cursor-text text-sm font-semibold text-gray-900 hover:text-[#EC8601]"
              >
                {topic.title || "Untitled Topic"}
              </h3>
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
                placeholder="Add topic description..."
                rows={2}
                className="mt-1.5 w-full resize-none rounded-md border border-[#EC8601] bg-white px-2 py-1.5 text-xs outline-none"
              />
            ) : (
              <p
                onClick={() =>
                  setEditingDescription(true)
                }
                className="mt-1.5 cursor-text text-xs text-gray-400 transition hover:text-gray-600"
              >
                {topic.description ||
                  "Click to Add Description"}
              </p>
            )}

          </div>

          {/* Delete */}

          <button
            onClick={() =>
              deleteTopic(
                moduleId,
                topic.id
              )
            }
            className="shrink-0 self-start rounded-md px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-red-50 hover:text-red-500"
          >
            Delete
          </button>

        </div>
      </div>

      {/* Topic Content */}

      {isOpen && (
        <div className="border-t border-gray-200 px-3 py-3 pl-8 sm:px-4 sm:pl-12">

          {/* Lessons */}

          {topic.lessons.length > 0 && (
            <div className="space-y-2">

              {topic.lessons.map(
                (lesson) => (
                  <Lesson
                    key={lesson.id}
                    lesson={lesson}
                    moduleId={moduleId}
                    topicId={topic.id}
                    updateLesson={
                      updateLesson
                    }
                    deleteLesson={
                      deleteLesson
                    }
                  />
                )
              )}

            </div>
          )}

          {/* Add Lesson */}

          <button
            onClick={() =>
              addLesson(
                moduleId,
                topic.id
              )
            }
            className="mt-3 rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:border-[#EC8601] hover:text-[#EC8601]"
          >
            + Add Lesson
          </button>

        </div>
      )}

    </div>
  );
}

export default Topic;