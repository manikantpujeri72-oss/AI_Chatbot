const fs = require("fs");
const path = require("path");

const inputPath = path.join(
  __dirname,
  "..",
  "data",
  "mce-data",
  "mce-pages.json"
);

const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "mce-data",
  "mce-clean.json"
);


// ==========================================
// CLEAN WEBSITE TEXT
// ==========================================

function cleanText(text) {
  if (!text) return "";

  let cleaned = text;

  // Remove common website navigation/header text
  const removePhrases = [
    "Welcome to Malnad College of Engineering-An Autonomous Institution, Affiliated to VTU",
    "UG 2025-26 are Open",
    "Admission 2026-27 (MGMT)",
    "Admission Online Payment",
    "Mandatory Bodies and Committees",
    "Student sScholarshipsProspectusNewsletterEnquiry",
    "Admission Enquiry",
    "Academic Affairs",
    "ExaminationProcess Seat Allotment",
    "Fee PaymentsResults",
    "Malpractice Enquiry Committee",
    "Training and Placements",
    "Training And Placements Overview",
    "Placement Policy",
    "Upcoming Placement Drives",
    "Upcoming Skill Development Activities",
    "Testimonials",
    "Our Recruiters",
    "Placement Records",
    "Other Wings",
    "Make In MCE",
    "Facilities",
    "Library",
    "Sports",
    "Hostel",
    "Transport",
    "Clubs",
    "IT-Infrastructure",
    "Facilities for differently abled",
    "Health Facility",
    "Network Control Centre",
    "National Service Scheme",
    "MOU",
    "Faculty Profile",
    "IRI",
    "NSS",
    "Spiritual Enclave",
    "Government Initiative",
    "TEQIP",
    "TEQIP-I",
    "TEQIP-II",
    "TEQIP-III",
    "Institution's Innovation Council",
    "Unnat Bharath Abhiyan",
    "New Age Innovation Network",
    "Startup Karnataka",
    "AICTE IDEA-Lab",
    "People",
    "Facility",
    "Events",
    "Achievements & Appreciations",
    "Quick Links",
    "Useful Links",
    "Click here",
  ];

  for (const phrase of removePhrases) {
    cleaned = cleaned.replaceAll(phrase, " ");
  }

  // Remove repeated whitespace
  cleaned = cleaned.replace(/\s+/g, " ");

  // Remove repeated punctuation spacing
  cleaned = cleaned.replace(/\s+([,.!?;:])/g, "$1");

  return cleaned.trim();
}


// ==========================================
// REMOVE DUPLICATE TEXT
// ==========================================

function removeRepeatedText(text) {
  if (!text) return "";

  const words = text.split(/\s+/);

  const result = [];
  let previousSentence = "";

  for (let i = 0; i < words.length; i++) {
    const current = words[i];

    result.push(current);

    // Prevent obvious repeated blocks
    if (result.length > 20) {
      const recent = result.slice(-20).join(" ");

      if (
        recent === previousSentence &&
        previousSentence.length > 50
      ) {
        result.splice(-20);
      }

      previousSentence = recent;
    }
  }

  return result.join(" ");
}


// ==========================================
// MAIN CLEANING
// ==========================================

function cleanPages() {

  console.log("Loading crawled MCE pages...\n");

  if (!fs.existsSync(inputPath)) {
    console.error("mce-pages.json not found!");
    console.error(`Expected file: ${inputPath}`);
    return;
  }

  const pages = JSON.parse(
    fs.readFileSync(inputPath, "utf8")
  );

  console.log(`Pages loaded: ${pages.length}\n`);

  const cleanedPages = [];

  for (const page of pages) {

    let text = page.text || "";

    // First cleaning
    text = cleanText(text);

    // Remove repeated content
    text = removeRepeatedText(text);

    // Final whitespace cleanup
    text = text.replace(/\s+/g, " ").trim();

    // Only keep useful pages
    if (text.length < 80) {
      continue;
    }

    cleanedPages.push({
      url: page.url,
      title: page.title,
      text: text,
    });
  }


  // ==========================================
  // SAVE CLEAN DATA
  // ==========================================

  fs.writeFileSync(
    outputPath,
    JSON.stringify(cleanedPages, null, 2),
    "utf8"
  );

  console.log("Cleaning completed!");
  console.log(`Original pages : ${pages.length}`);
  console.log(`Clean pages    : ${cleanedPages.length}`);
  console.log(`Saved to       : ${outputPath}`);
}


// ==========================================
// RUN
// ==========================================

cleanPages();