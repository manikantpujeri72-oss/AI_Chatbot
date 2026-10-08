const fs = require("fs");
const path = require("path");

// ==========================================
// Configuration
// ==========================================

const INPUT_FILE = path.join(
  __dirname,
  "..",
  "data",
  "mce-data",
  "mce-clean.json"
);

const OUTPUT_FILE = path.join(
  __dirname,
  "..",
  "data",
  "mce-data",
  "mce-chunks.json"
);

// Target chunk size
const MAX_CHUNK_SIZE = 900;

// Minimum chunk size
const MIN_CHUNK_SIZE = 250;

// ==========================================
// Load Clean Data
// ==========================================

let pages = [];

try {
  const data = fs.readFileSync(
    INPUT_FILE,
    "utf8"
  );

  pages = JSON.parse(data);

  console.log(
    `Clean pages loaded: ${pages.length}`
  );
} catch (error) {
  console.error(
    "Could not load mce-clean.json"
  );

  console.error(error.message);

  process.exit(1);
}

// ==========================================
// Split Text into Sentences
// ==========================================

function splitIntoSentences(text) {
  if (!text) {
    return [];
  }

  const normalized = text
    .replace(/\r/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return [];
  }

  // Split after sentence-ending punctuation.
  const sentences =
    normalized.match(
      /[^.!?]+[.!?]+|[^.!?]+$/g
    ) || [];

  return sentences
    .map((sentence) =>
      sentence.trim()
    )
    .filter(Boolean);
}

// ==========================================
// Create Sentence-Safe Chunks
// ==========================================

function createChunks(page) {
  const text = (page.text || "").trim();

  if (!text) {
    return [];
  }

  const sentences =
    splitIntoSentences(text);

  const chunks = [];

  let currentText = "";

  for (const sentence of sentences) {

    const candidate = currentText
      ? `${currentText} ${sentence}`
      : sentence;

    // Keep sentences together whenever possible
    if (
      candidate.length <= MAX_CHUNK_SIZE
    ) {
      currentText = candidate;
      continue;
    }

    // Save current chunk
    if (
      currentText.length >= MIN_CHUNK_SIZE
    ) {
      chunks.push(currentText.trim());
    }

    // Start a new chunk with the current sentence
    currentText = sentence;

    // Handle extremely long individual sentences
    if (
      currentText.length > MAX_CHUNK_SIZE
    ) {
      let start = 0;

      while (
        start < currentText.length
      ) {
        const part =
          currentText.slice(
            start,
            start + MAX_CHUNK_SIZE
          );

        if (part.trim()) {
          chunks.push(
            part.trim()
          );
        }

        start += MAX_CHUNK_SIZE;
      }

      currentText = "";
    }
  }

  // Add final chunk
  if (currentText.trim()) {
    chunks.push(
      currentText.trim()
    );
  }

  return chunks;
}

// ==========================================
// Generate Knowledge Chunks
// ==========================================

const allChunks = [];

for (const page of pages) {

  const chunks =
    createChunks(page);

  chunks.forEach(
    (chunkText, index) => {

      allChunks.push({
        id: `chunk-${allChunks.length + 1}`,

        title:
          page.title ||
          "MCE Information",

        url:
          page.url || "",

        text: chunkText,

        chunkIndex: index,

        totalChunks: chunks.length,
      });
    }
  );
}

// ==========================================
// Remove Duplicate Chunks
// ==========================================

const uniqueChunks = [];
const seen = new Set();

for (const chunk of allChunks) {

  const key =
    `${chunk.url}|${chunk.text}`;

  if (!seen.has(key)) {
    seen.add(key);
    uniqueChunks.push(chunk);
  }
}

// ==========================================
// Save Knowledge Base
// ==========================================

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    uniqueChunks,
    null,
    2
  ),
  "utf8"
);

console.log("");
console.log(
  "=========================================="
);

console.log(
  "Chunking completed successfully!"
);

console.log(
  "=========================================="
);

console.log(
  `Pages loaded : ${pages.length}`
);

console.log(
  `Chunks created: ${uniqueChunks.length}`
);

console.log("");
console.log(
  "Saved to:"
);

console.log(
  OUTPUT_FILE
);

console.log(
  "=========================================="
);