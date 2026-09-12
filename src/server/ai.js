import process from "node:process";
import { GoogleGenAI } from "@google/genai";

const systemPrompt = `
You are a curriculum extraction assistant.

Your job is to extract curriculum structure from the provided PDF text.

The hierarchy is:

Module
  -> Topic
      -> Lesson

IMPORTANT RULES:

1. Return exactly one JSON object.

2. The root object must contain "modules".

3. "modules" must be an array.

4. Every module must contain:
   - title
   - description
   - topics

5. Every topic must contain:
   - title
   - description
   - lessons

6. Every lesson must contain:
   - title
   - description

7. Preserve titles from the PDF whenever possible.

8. Preserve the original hierarchy when it is clearly present.

9. If topics are missing but can reasonably be inferred,
   create suitable topics.

10. If lessons are missing but can reasonably be inferred,
    create suitable lessons.

11. Do not invent unrelated content.

12. Keep descriptions short and useful.

13. Do not add markdown.

14. Do not add explanations.

15. Return only valid JSON.

16. The root must be an object, never an array.
`;


// ----------------------------------------
// JSON schema used by Gemini
// ----------------------------------------

const curriculumSchema = {
  type: "object",

  properties: {
    modules: {
      type: "array",

      items: {
        type: "object",

        properties: {
          title: {
            type: "string",
          },

          description: {
            type: "string",
          },

          topics: {
            type: "array",

            items: {
              type: "object",

              properties: {
                title: {
                  type: "string",
                },

                description: {
                  type: "string",
                },

                lessons: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      title: {
                        type: "string",
                      },

                      description: {
                        type: "string",
                      },
                    },

                    required: [
                      "title",
                      "description",
                    ],
                  },
                },
              },

              required: [
                "title",
                "description",
                "lessons",
              ],
            },
          },
        },

        required: [
          "title",
          "description",
          "topics",
        ],
      },
    },
  },

  required: [
    "modules",
  ],
};


// ----------------------------------------
// Retry Gemini request
// ----------------------------------------

async function generateWithRetry(
  ai,
  request,
  retries = 3
) {
  for (
    let attempt = 1;
    attempt <= retries;
    attempt++
  ) {
    try {
      console.log(
        `Gemini request attempt ${attempt}/${retries}...`
      );

      const response =
        await ai.models.generateContent(
          request
        );

      return response;

    } catch (error) {
      const message =
        error?.message || "";

      const isTemporaryError =
        message.includes("503") ||
        message.includes("UNAVAILABLE") ||
        message.includes("429") ||
        message.includes(
          "RESOURCE_EXHAUSTED"
        );

      // If it is not a temporary error,
      // don't retry.
      if (
        !isTemporaryError ||
        attempt === retries
      ) {
        throw error;
      }

      // Wait 5s, 10s, 15s
      const waitTime =
        attempt * 5000;

      console.log(
        `Gemini temporarily unavailable.`
      );

      console.log(
        `Retrying in ${
          waitTime / 1000
        } seconds...`
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            waitTime
          )
      );
    }
  }
}


// ----------------------------------------
// Split large PDF text into chunks
// ----------------------------------------

function splitTextIntoChunks(text) {
  const chunkSize = 30000;

  const chunks = [];

  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to end the chunk at a newline
    if (end < text.length) {
      const lastNewLine =
        text.lastIndexOf(
          "\n",
          end
        );

      if (
        lastNewLine >
        start + 15000
      ) {
        end = lastNewLine;
      }
    }

    chunks.push(
      text.slice(start, end)
    );

    start = end;
  }

  return chunks;
}


// ----------------------------------------
// Generate curriculum for one chunk
// ----------------------------------------

async function generateChunk(
  text,
  chunkNumber,
  totalChunks,
  sendProgress
) {
  console.log(
    `Processing chunk ${chunkNumber}/${totalChunks}...`
  );

  // Tell frontend chunk started
  sendProgress({
    type: "chunk",

    current: chunkNumber,

    total: totalChunks,

    percentage: Math.round(
      ((chunkNumber - 1) /
        totalChunks) *
        100
    ),

    message:
      "Analyzing modules, topics and lessons...",
  });


  // ----------------------------------------
  // Create Gemini client
  // ----------------------------------------

  const ai = new GoogleGenAI({
    apiKey:
      process.env.GEMINI_API_KEY,
  });


  try {

    // ----------------------------------------
    // Gemini request
    // ----------------------------------------

    const response =
      await generateWithRetry(
        ai,
        {
          model: "gemini-2.5-flash",

          contents: `
${systemPrompt}

This is chunk ${chunkNumber} of ${totalChunks}.

Extract all curriculum modules from this PDF section.

IMPORTANT:

- Return only the modules found in this section.
- Return one JSON object.
- The root object must contain "modules".
- Do not return an array as the root.
- Keep the Module -> Topic -> Lesson hierarchy.

PDF SECTION:

${text}
`,

          config: {
            temperature: 0.2,

            responseMimeType:
              "application/json",

            responseSchema:
              curriculumSchema,
          },
        }
      );


    // ----------------------------------------
    // Read Gemini response
    // ----------------------------------------

    const content =
      response.text;


    if (!content) {
      throw new Error(
        `Gemini returned an empty response for chunk ${chunkNumber}.`
      );
    }


    console.log(
      `Gemini response received for chunk ${chunkNumber}.`
    );


    // ----------------------------------------
    // Parse JSON
    // ----------------------------------------

    const parsed =
      JSON.parse(content);


    // ----------------------------------------
    // Validate root
    // ----------------------------------------

    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        "Gemini returned an invalid root format."
      );
    }


    // ----------------------------------------
    // Validate modules
    // ----------------------------------------

    if (
      !Array.isArray(
        parsed.modules
      )
    ) {
      throw new Error(
        "Gemini response does not contain modules."
      );
    }


    // ----------------------------------------
    // Tell frontend chunk completed
    // ----------------------------------------

    sendProgress({
      type:
        "chunk-complete",

      current:
        chunkNumber,

      total:
        totalChunks,

      percentage:
        Math.round(
          (chunkNumber /
            totalChunks) *
            100
        ),

      message:
        "Analyzing modules, topics and lessons...",
    });


    return parsed.modules;

  } catch (error) {

    console.error(
      `Gemini error in chunk ${chunkNumber}:`,
      error.message
    );


    throw new Error(
      `AI failed while processing chunk ${chunkNumber}: ${error.message}`
    );
  }
}


// ----------------------------------------
// Main curriculum generation
// ----------------------------------------

export async function generateCurriculum(
  text,
  sendProgress
) {

  // ----------------------------------------
  // Check API key
  // ----------------------------------------

  if (
    !process.env.GEMINI_API_KEY
  ) {
    throw new Error(
      "GEMINI_API_KEY is missing in your .env file."
    );
  }


  // ----------------------------------------
  // Check PDF text
  // ----------------------------------------

  if (
    !text ||
    !text.trim()
  ) {
    throw new Error(
      "No PDF text was provided."
    );
  }


  // ----------------------------------------
  // Split PDF into chunks
  // ----------------------------------------

  const chunks =
    splitTextIntoChunks(text);


  console.log(
    `PDF split into ${chunks.length} chunks.`
  );


  // ----------------------------------------
  // Tell frontend number of chunks
  // ----------------------------------------

  sendProgress({
    type: "prepared",

    total:
      chunks.length,

    percentage: 0,

    message:
      "Analyzing modules, topics and lessons...",
  });


  let allModules = [];


  // ----------------------------------------
  // Process chunks one by one
  // ----------------------------------------

  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {

    const modules =
      await generateChunk(
        chunks[i],

        i + 1,

        chunks.length,

        sendProgress
      );


    allModules = [
      ...allModules,
      ...modules,
    ];
  }


  // ----------------------------------------
  // Final result
  // ----------------------------------------

  console.log(
    `Total modules generated: ${allModules.length}`
  );


  return {
    title:
      "Generated Curriculum",

    description:
      "Curriculum generated from the uploaded PDF.",

    modules:
      allModules,
  };
}