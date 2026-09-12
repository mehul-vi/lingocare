import { useEffect, useRef, useState } from "react";

import Header from "../components/Header";
import Module from "../components/Module";

import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function CurriculumPage() {
  // --------------------------------
  // Curriculum state
  // --------------------------------

  const [curriculum, setCurriculum] = useState(() => {
    const saved = localStorage.getItem("curriculum");

    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("curriculum");
      return null;
    }
  });

  // --------------------------------
  // AI states
  // --------------------------------

  const [isGenerating, setIsGenerating] = useState(false);

  const [error, setError] = useState("");

  const [generationProgress, setGenerationProgress] =
    useState({
      current: 0,
      total: 0,
      percentage: 0,
      message: "",
    });

  // --------------------------------
  // Description textarea
  // --------------------------------

  const descriptionRef = useRef(null);

  // --------------------------------
  // Save curriculum to localStorage
  // --------------------------------

  useEffect(() => {
    if (curriculum) {
      localStorage.setItem(
        "curriculum",
        JSON.stringify(curriculum)
      );
    } else {
      localStorage.removeItem("curriculum");
    }
  }, [curriculum]);

  // --------------------------------
  // Automatically resize description
  // --------------------------------

  useEffect(() => {
    const textarea = descriptionRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [curriculum?.description]);

  // --------------------------------
  // Add Curriculum
  // --------------------------------

  const addCurriculum = () => {
    setCurriculum({
      title: "New Curriculum",
      description: "",
      modules: [],
    });
  };

  // --------------------------------
  // Upload PDF + Generate Curriculum
  // --------------------------------

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      setError("");
      setIsGenerating(true);

      setGenerationProgress({
        current: 0,
        total: 0,
        percentage: 0,
        message: "Uploading PDF...",
      });

      // --------------------------------
      // Read PDF
      // --------------------------------

      const arrayBuffer = await file.arrayBuffer();

      setGenerationProgress({
        current: 0,
        total: 0,
        percentage: 5,
        message: "Reading PDF...",
      });

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
      }).promise;

      let text = "";

      // --------------------------------
      // Extract text from every page
      // --------------------------------

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const content = await page.getTextContent();

        text +=
          content.items
            .map((item) => item.str)
            .join(" ") + "\n";

        // Small progress while reading PDF
        const pdfPercentage = Math.round(
          (i / pdf.numPages) * 10
        );

        setGenerationProgress({
          current: 0,
          total: 0,
          percentage: pdfPercentage,
          message: `Reading PDF page ${i} of ${pdf.numPages}...`,
        });
      }

      // --------------------------------
      // Check extracted text
      // --------------------------------

      if (!text.trim()) {
        throw new Error(
          "Could not extract any text from this PDF."
        );
      }

      setGenerationProgress({
        current: 0,
        total: 0,
        percentage: 10,
        message: "PDF text extracted",
      });

      // --------------------------------
      // Send text to deployed backend
      // --------------------------------

      const response = await fetch(
        "https://lingocare-amber.vercel.app/api/generate-curriculum",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "AI generation request failed."
        );
      }

      // --------------------------------
      // Make sure streaming is available
      // --------------------------------

      if (!response.body) {
        throw new Error(
          "Streaming response is not supported."
        );
      }

      // --------------------------------
      // Read streaming response
      // --------------------------------

      const reader = response.body.getReader();

      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { value, done } =
          await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const messages = buffer.split("\n\n");

        buffer = messages.pop() || "";

        for (const message of messages) {
          if (!message.startsWith("data:")) {
            continue;
          }

          const jsonString = message
            .replace("data:", "")
            .trim();

          if (!jsonString) continue;

          const data = JSON.parse(jsonString);

          // --------------------------------
          // Generation started
          // --------------------------------

          if (data.type === "started") {
            setGenerationProgress({
              current: 0,
              total: 0,
              percentage: 10,
              message: data.message,
            });
          }

          // --------------------------------
          // Chunks prepared
          // --------------------------------

          if (data.type === "prepared") {
            setGenerationProgress({
              current: 0,
              total: data.total,
              percentage: 10,
              message: data.message,
            });
          }

          // --------------------------------
          // Chunk started
          // --------------------------------

          if (data.type === "chunk") {
            setGenerationProgress({
              current: data.current,
              total: data.total,
              percentage: data.percentage,
              message: data.message,
            });
          }

          // --------------------------------
          // Chunk completed
          // --------------------------------

          if (data.type === "chunk-complete") {
            setGenerationProgress({
              current: data.current,
              total: data.total,
              percentage: data.percentage,
              message: data.message,
            });
          }

          // --------------------------------
          // AI generation completed
          // --------------------------------

          if (data.type === "complete") {
            const ai = data.curriculum;

            // --------------------------------
            // Format generated curriculum
            // --------------------------------

            const formattedCurriculum = {
              title:
                ai.title ||
                "Generated Curriculum",

              description:
                ai.description || "",

              modules: (ai.modules || []).map(
                (module) => ({
                  id:
                    Date.now() +
                    Math.random(),

                  title:
                    module.title ||
                    "New Module",

                  description:
                    module.description ||
                    "",

                  topics: (
                    module.topics || []
                  ).map((topic) => ({
                    id:
                      Date.now() +
                      Math.random(),

                    title:
                      topic.title ||
                      "New Topic",

                    description:
                      topic.description ||
                      "",

                    lessons: (
                      topic.lessons || []
                    ).map((lesson) => ({
                      id:
                        Date.now() +
                        Math.random(),

                      title:
                        lesson.title ||
                        "New Lesson",

                      description:
                        lesson.description ||
                        "",
                    })),
                  })),
                })
              ),
            };

            // --------------------------------
            // Put generated curriculum on page
            // --------------------------------

            setCurriculum(
              formattedCurriculum
            );

            setGenerationProgress({
              current:
                data.curriculum?.modules
                  ?.length || 1,

              total:
                data.curriculum?.modules
                  ?.length || 1,

              percentage: 100,

              message:
                "Curriculum generated successfully!",
            });
          }

          // --------------------------------
          // Backend error
          // --------------------------------

          if (data.type === "error") {
            throw new Error(
              data.message ||
                "AI generation failed."
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "Curriculum generation error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong while generating curriculum."
      );
    } finally {
      setIsGenerating(false);

      // Reset file input
      e.target.value = "";
    }
  };

  // --------------------------------
  // Add Module
  // --------------------------------

  const addModule = () => {
    const newModule = {
      id: Date.now(),
      title: "New Module",
      description: "",
      topics: [],
    };

    setCurriculum((prev) => ({
      ...prev,

      modules: [
        ...prev.modules,
        newModule,
      ],
    }));
  };

  // --------------------------------
  // Update Module
  // --------------------------------

  const updateModule = (
    id,
    field,
    value
  ) => {
    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.map(
        (module) =>
          module.id === id
            ? {
                ...module,
                [field]: value,
              }
            : module
      ),
    }));
  };

  // --------------------------------
  // Delete Module
  // --------------------------------

  const deleteModule = (id) => {
    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.filter(
        (module) =>
          module.id !== id
      ),
    }));
  };

  // --------------------------------
  // Add Topic
  // --------------------------------

  const addTopic = (moduleId) => {
    const newTopic = {
      id: Date.now(),
      title: "New Topic",
      description: "",
      lessons: [],
    };

    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.map(
        (module) =>
          module.id === moduleId
            ? {
                ...module,

                topics: [
                  ...module.topics,
                  newTopic,
                ],
              }
            : module
      ),
    }));
  };

  // --------------------------------
  // Update Topic
  // --------------------------------

  const updateTopic = (
    moduleId,
    topicId,
    field,
    value
  ) => {
    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.map(
        (module) =>
          module.id === moduleId
            ? {
                ...module,

                topics:
                  module.topics.map(
                    (topic) =>
                      topic.id === topicId
                        ? {
                            ...topic,
                            [field]:
                              value,
                          }
                        : topic
                  ),
              }
            : module
      ),
    }));
  };

  // --------------------------------
  // Delete Topic
  // --------------------------------

  const deleteTopic = (
    moduleId,
    topicId
  ) => {
    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.map(
        (module) =>
          module.id === moduleId
            ? {
                ...module,

                topics:
                  module.topics.filter(
                    (topic) =>
                      topic.id !==
                      topicId
                  ),
              }
            : module
      ),
    }));
  };

  // --------------------------------
  // Add Lesson
  // --------------------------------

  const addLesson = (
    moduleId,
    topicId
  ) => {
    const newLesson = {
      id: Date.now(),
      title: "New Lesson",
      description: "",
    };

    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.map(
        (module) =>
          module.id === moduleId
            ? {
                ...module,

                topics:
                  module.topics.map(
                    (topic) =>
                      topic.id === topicId
                        ? {
                            ...topic,

                            lessons: [
                              ...topic.lessons,
                              newLesson,
                            ],
                          }
                        : topic
                  ),
              }
            : module
      ),
    }));
  };

  // --------------------------------
  // Update Lesson
  // --------------------------------

  const updateLesson = (
    moduleId,
    topicId,
    lessonId,
    field,
    value
  ) => {
    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.map(
        (module) =>
          module.id === moduleId
            ? {
                ...module,

                topics:
                  module.topics.map(
                    (topic) =>
                      topic.id === topicId
                        ? {
                            ...topic,

                            lessons:
                              topic.lessons.map(
                                (lesson) =>
                                  lesson.id ===
                                  lessonId
                                    ? {
                                        ...lesson,
                                        [field]:
                                          value,
                                      }
                                    : lesson
                              ),
                          }
                        : topic
                  ),
              }
            : module
      ),
    }));
  };

  // --------------------------------
  // Delete Lesson
  // --------------------------------

  const deleteLesson = (
    moduleId,
    topicId,
    lessonId
  ) => {
    setCurriculum((prev) => ({
      ...prev,

      modules: prev.modules.map(
        (module) =>
          module.id === moduleId
            ? {
                ...module,

                topics:
                  module.topics.map(
                    (topic) =>
                      topic.id === topicId
                        ? {
                            ...topic,

                            lessons:
                              topic.lessons.filter(
                                (lesson) =>
                                  lesson.id !==
                                  lessonId
                              ),
                          }
                        : topic
                  ),
              }
            : module
      ),
    }));
  };

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div className="min-h-screen bg-[#f8f8f7]">

      {/* Header */}

      <Header
        onUpload={handleUpload}
        isGenerating={isGenerating}
      />

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-6">

        {/* AI Loading / Progress */}

        {isGenerating && (
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-5">

            <div className="mb-3 flex items-center justify-between">

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Generating curriculum...
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {
                    generationProgress.message
                  }
                </p>
              </div>

              <span className="text-sm font-semibold text-[#EC8601]">
                {
                  generationProgress.percentage
                }
                %
              </span>

            </div>

            {/* Progress Bar */}

            <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100">

              <div
                className="h-full rounded-full bg-[#EC8601] transition-all duration-500"
                style={{
                  width: `${
                    generationProgress.percentage
                  }%`,
                }}
              />

            </div>

            {/* Chunk */}

            {generationProgress.total >
              0 && (
              <p className="mt-3 text-xs text-gray-500">
                Processing chunk{" "}
                {
                  generationProgress.current
                }{" "}
                of{" "}
                {
                  generationProgress.total
                }
              </p>
            )}

          </div>
        )}

        {/* Error */}

        {error && (
          <div className="mb-6 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">

            <div>
              <p className="text-sm font-medium text-red-700">
                Something went wrong
              </p>

              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                setError("")
              }
              className="ml-4 text-xs text-red-500 transition hover:text-red-700"
            >
              Dismiss
            </button>

          </div>
        )}

        {/* No Curriculum */}

        {!curriculum ? (
          <div className="flex min-h-[65vh] items-center justify-center">

            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-2xl font-light text-[#EC8601]">
                +
              </div>

              <h2 className="mt-5 text-xl font-semibold text-gray-900">
                Create your curriculum
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Start building your curriculum manually or
                upload a PDF to generate one with AI.
              </p>

              <button
                onClick={addCurriculum}
                disabled={isGenerating}
                className="mt-6 rounded-md bg-[#EC8601] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#d97700] disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Curriculum
              </button>

            </div>

          </div>
        ) : (
          <>
            {/* Curriculum Header */}

            <section className="mb-8 border-b border-gray-200 pb-7">

              <div className="flex items-start justify-between gap-6">

                <div className="min-w-0 flex-1">

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EC8601]">
                    Curriculum
                  </p>

                  <input
                    value={curriculum.title}
                    onChange={(e) =>
                      setCurriculum(
                        (prev) => ({
                          ...prev,
                          title:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="Untitled Curriculum"
                    className="mt-2 block w-full bg-transparent text-[28px] font-semibold leading-tight tracking-tight text-gray-900 outline-none placeholder:text-gray-300"
                  />

                </div>

                {/* Module Count */}

                <span className="mt-1 shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
                  {curriculum.modules.length}{" "}
                  {curriculum.modules.length ===
                  1
                    ? "Module"
                    : "Modules"}
                </span>

              </div>

              {/* Curriculum Description */}

              <textarea
                ref={descriptionRef}
                value={
                  curriculum.description
                }
                onChange={(e) => {
                  const value =
                    e.target.value;

                  e.target.style.height =
                    "auto";

                  e.target.style.height =
                    `${e.target.scrollHeight}px`;

                  setCurriculum(
                    (prev) => ({
                      ...prev,
                      description:
                        value,
                    })
                  );
                }}
                placeholder="Add a description..."
                rows={1}
                className="mt-2 block w-full resize-none overflow-hidden bg-transparent text-sm leading-6 text-gray-500 outline-none placeholder:text-gray-400"
              />

              {/* Add Module */}

              <button
                onClick={addModule}
                disabled={isGenerating}
                className="mt-4 rounded-md bg-[#EC8601] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#d97700] disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Add Module
              </button>

            </section>

            {/* Structure */}

            <section>

              <div className="mb-5 flex items-end justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Structure
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Organize your curriculum into modules, topics and lessons.
                  </p>
                </div>

                {curriculum.modules.length >
                  0 && (
                  <span className="text-xs text-gray-400">
                    {
                      curriculum.modules
                        .length
                    }{" "}
                    {curriculum.modules
                      .length === 1
                      ? "Module"
                      : "Modules"}
                  </span>
                )}

              </div>

              {/* Empty Modules */}

              {curriculum.modules.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">

                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-lg text-gray-400">
                    +
                  </div>

                  <p className="mt-4 text-sm font-medium text-gray-700">
                    No modules yet
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Add a module to start building your curriculum.
                  </p>

                  <button
                    onClick={addModule}
                    disabled={isGenerating}
                    className="mt-4 text-sm font-medium text-[#EC8601] transition hover:text-[#d97700]"
                  >
                    + Add Module
                  </button>

                </div>
              ) : (

                /* Modules */

                <div className="space-y-4">

                  {curriculum.modules.map(
                    (module) => (
                      <Module
                        key={module.id}
                        module={module}
                        updateModule={
                          updateModule
                        }
                        deleteModule={
                          deleteModule
                        }
                        addTopic={
                          addTopic
                        }
                        updateTopic={
                          updateTopic
                        }
                        deleteTopic={
                          deleteTopic
                        }
                        addLesson={
                          addLesson
                        }
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

            </section>
          </>
        )}

      </main>
    </div>
  );
}

export default CurriculumPage;