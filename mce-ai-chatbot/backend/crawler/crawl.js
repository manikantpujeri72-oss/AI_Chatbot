const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const START_URL = "https://www.mcehassan.ac.in/";
const MAX_PAGES = 200;

const visited = new Set();
const pages = [];


// ==========================================
// PRIORITY PAGES
// ==========================================

const PRIORITY_PATHS = [
  "/home/Hostel",
  "/home/Boys-Hostel",
  "/home/Girls-Hostel",

  "/home/Programs-Offered",
  "/home/Undergraduate",
  "/home/Postgraduate",
  "/home/Research-Programs",

  "/home/Admission_Information",
"/home/Enquiry",

  "/home/Training-And-Placements-Overview",
  "/home/placement-policy-overview",
  "/home/Our-Recruiters",
  "/home/Placement-Records",

  "/home/Library",
  "/home/Facilities",
  "/home/Contact",
];


// ==========================================
// CLEAN TEXT
// ==========================================

function cleanText(text) {
  if (!text) {
    return "";
  }

  return text
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ==========================================
// VALID URL
// ==========================================

function isValidUrl(url) {
  try {
    const parsed = new URL(url);

    // Only official MCE website
    if (parsed.hostname !== "www.mcehassan.ac.in") {
      return false;
    }

    const blockedExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".ico",
      ".zip",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".mp4",
      ".mp3",
    ];

    const pathname = parsed.pathname.toLowerCase();

    // Block files
    if (
      blockedExtensions.some((extension) =>
        pathname.endsWith(extension)
      )
    ) {
      return false;
    }

    // Block files hidden inside query parameters
    const fullUrl = decodeURIComponent(
      parsed.href.toLowerCase()
    );

    if (
      blockedExtensions.some((extension) =>
        fullUrl.includes(extension)
      )
    ) {
      return false;
    }

    // Block gallery images
    if (
      pathname.includes("/secure-file/gallery") ||
      pathname.includes("/gallery/")
    ) {
      return false;
    }

    return true;

  } catch {
    return false;
  }
}


// ==========================================
// REMOVE WEBSITE CHROME
// ==========================================

function removeWebsiteChrome($) {

  // Technical elements
  $(
    "script, style, noscript, iframe, svg, canvas, " +
    "form, input, button"
  ).remove();

  // Header and navigation
  $(
    "header, nav, " +
    ".header, .navbar, .navigation, .menu, " +
    ".main-menu, .top-menu, .mega-menu"
  ).remove();

  // Footer
  $(
    "footer, .footer, .site-footer"
  ).remove();

  // Sidebars
  $(
    ".sidebar, .left-sidebar, .right-sidebar, " +
    ".widget-area, .side-menu"
  ).remove();

  // Breadcrumbs
  $(
    ".breadcrumb, .breadcrumbs, " +
    ".page-breadcrumb, .breadcrumb-area"
  ).remove();

  // Popups and overlays
  $(
    ".modal, .popup, .overlay, " +
    ".preloader, #preloader"
  ).remove();
}


// ==========================================
// EXTRACT MAIN CONTENT
// ==========================================

function extractMainContent($) {

  removeWebsiteChrome($);


  // ========================================
  // MAIN CONTENT SELECTORS
  // ========================================

  const selectors = [
    "main",
    "article",
    ".main-content",
    ".page-content",
    ".content-area",
    ".inner-content",
    ".site-content",
    ".single-content",
    ".entry-content",
    ".post-content",
    "#content",
    "#main",
  ];


  for (const selector of selectors) {

    const elements = $(selector);

    for (let i = 0; i < elements.length; i++) {

      const element = elements.eq(i);

      const text = cleanText(
        element.text()
      );

      if (text.length >= 300) {
        return text;
      }
    }
  }


  // ========================================
  // SEARCH RELEVANT HEADINGS
  // ========================================

  const headingKeywords = [
    "hostel",
    "boys hostel",
    "girls hostel",
    "admission",
    "placement",
    "program",
    "programs",
    "course",
    "courses",
    "library",
    "faculty",
    "research",
    "department",
    "facility",
    "facilities",
    "contact",
    "scholarship",
  ];


  for (const keyword of headingKeywords) {

    let foundText = "";

    $("h1, h2, h3, h4").each(
      (index, element) => {

        const heading = cleanText(
          $(element).text()
        ).toLowerCase();

        if (!heading.includes(keyword)) {
          return;
        }

        // Parent
        const parent = $(element).parent();

        const parentText = cleanText(
          parent.text()
        );

        if (
          parentText.length > foundText.length &&
          parentText.length >= 300
        ) {
          foundText = parentText;
        }

        // Grandparent
        const grandParent = parent.parent();

        const grandParentText = cleanText(
          grandParent.text()
        );

        if (
          grandParentText.length > foundText.length &&
          grandParentText.length >= 300
        ) {
          foundText = grandParentText;
        }
      }
    );

    if (foundText.length >= 300) {
      return foundText;
    }
  }


  // ========================================
  // FALLBACK
  // ========================================

  let largestText = "";

  $("div, section").each(
    (index, element) => {

      const text = cleanText(
        $(element).text()
      );

      if (
        text.length > largestText.length &&
        text.length >= 300
      ) {
        largestText = text;
      }
    }
  );

if (largestText.length > 0) {
  return largestText;
}


// ========================================
// BODY TEXT FALLBACK
// ========================================

const bodyText = cleanText(
  $("body").text()
);

if (bodyText.length >= 100) {
  return bodyText;
}

return bodyText;
}


// ==========================================
// CRAWL PAGE
// ==========================================

async function crawlPage(url) {
console.log("DEBUG crawlPage called:", url);
  if (visited.has(url)) {
    return;
  }

  if (visited.size >= MAX_PAGES) {
    return;
  }

  visited.add(url);


  try {

    console.log(`Crawling: ${url}`);


    const response = await fetch(url);


    if (!response.ok) {

      console.log(
        `Skipped ${url} - HTTP ${response.status}`
      );

      return;
    }


    const html = await response.text();

    const $ = cheerio.load(html);


    // Page title
    const title = cleanText(
      $("title").text()
    );


    // Main content
    const text = extractMainContent($);
// ========================================
// FORCE IMPORTANT ADMISSION PAGE CONTENT
// ========================================

let finalText = text;

if (
  url.includes("/home/Admission_Information") ||
  url.includes("/home/Enquiry")
) {
  finalText = cleanText(
    $("body").text()
  );
}

    if (finalText.length >= 100) {
  pages.push({
    url,
    title,
    text: finalText,
  });
}


    // ======================================
    // FIND LINKS
    // ======================================

    const links = [];


    $("a[href]").each(
      (index, element) => {

        const href = $(element).attr("href");

        if (!href) {
          return;
        }


        try {

          const absoluteUrl =
            new URL(href, url);

          // Remove #section
          absoluteUrl.hash = "";


          const finalUrl =
            absoluteUrl.href;


          if (isValidUrl(finalUrl)) {
            links.push(finalUrl);
          }

        } catch {
          // Ignore invalid URLs
        }
      }
    );


    // Remove duplicate links
    const uniqueLinks = [
      ...new Set(links)
    ];


    // ======================================
    // PRIORITIZE IMPORTANT PAGES
    // ======================================

    const priorityLinks = [];
    const normalLinks = [];


    for (const link of uniqueLinks) {

      const parsedLink = new URL(link);

      const isPriority =
        PRIORITY_PATHS.some(
          (priorityPath) =>
            parsedLink.pathname.toLowerCase() ===
            priorityPath.toLowerCase()
        );


      if (isPriority) {
        priorityLinks.push(link);
      } else {
        normalLinks.push(link);
      }
    }


    // Important pages first
    const orderedLinks = [
      ...priorityLinks,
      ...normalLinks,
    ];


    // ======================================
    // CRAWL NEXT PAGES
    // ======================================

    for (const link of orderedLinks) {

      if (visited.size >= MAX_PAGES) {
        break;
      }


      if (!visited.has(link)) {
        await crawlPage(link);
      }
    }


  } catch (error) {

    console.log(
      `Error crawling ${url}`
    );

    console.log(
      error.message
    );
  }
}


// ==========================================
// START CRAWLER
// ==========================================

async function startCrawler() {

  console.log(
    "=========================================="
  );

  console.log(
    "          MCE WEBSITE CRAWLER"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Starting URL: ${START_URL}`
  );

  console.log(
    `Maximum pages: ${MAX_PAGES}\n`
  );


  // ========================================
  // CRAWL PRIORITY PAGES FIRST
  // ========================================

  console.log("Crawling priority pages first...\n");

  for (const priorityPath of PRIORITY_PATHS) {

    if (visited.size >= MAX_PAGES) {
      break;
    }

    const priorityUrl =
      new URL(
        priorityPath,
        START_URL
      ).href;

    if (!visited.has(priorityUrl)) {

      await crawlPage(
        priorityUrl
      );

    }

  }


  // ========================================
  // CRAWL MAIN WEBSITE
  // ========================================

  console.log(
    "\nCrawling main website...\n"
  );

  if (visited.size < MAX_PAGES) {

    await crawlPage(
      START_URL
    );

  }


  // ========================================
  // OUTPUT DIRECTORY
  // ========================================

  const outputDir = path.join(
    __dirname,
    "..",
    "data",
    "mce-data"
  );


  fs.mkdirSync(
    outputDir,
    {
      recursive: true,
    }
  );


  // ========================================
  // OUTPUT FILE
  // ========================================

  const outputPath = path.join(
    outputDir,
    "mce-pages.json"
  );


  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      pages,
      null,
      2
    ),
    "utf8"
  );


  // ========================================
  // FINAL REPORT
  // ========================================

  console.log(
    "\n=========================================="
  );

  console.log(
    "          CRAWLING COMPLETED"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Pages visited: ${visited.size}`
  );

  console.log(
    `Pages saved:   ${pages.length}`
  );

  console.log(
    `Saved to:      ${outputPath}`
  );

  console.log(
    "=========================================="
  );

}


// ==========================================
// RUN
// ==========================================

startCrawler();