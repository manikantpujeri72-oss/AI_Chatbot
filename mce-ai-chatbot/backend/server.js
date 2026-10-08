const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mceKnowledgePath = path.join(
  __dirname,
  "data",
  "mce-data",
  "mce-knowledge.json"
);

const mceKnowledge = JSON.parse(
  fs.readFileSync(mceKnowledgePath, "utf8")
);

console.log(
  `Loaded ${mceKnowledge.length} direct knowledge entries`
);
const { detectIntent } = require("./nlp/intentDetector");

const app = express();

app.use(cors());
app.use(express.json());

const chunksPath = path.join(
  __dirname,
  "data",
  "mce-data",
  "mce-chunks.json"
);

const menuPath = path.join(
  __dirname,
  "data",
  "hostel",
  "menu.json"
);

const feesPath = path.join(
  __dirname,
  "data",
  "hostel",
  "fees.json"
);

let chunks = [];
let hostelMenu = {};
let hostelFees = {};

try {
  chunks = JSON.parse(fs.readFileSync(chunksPath, "utf8"));
  console.log(`Loaded ${chunks.length} knowledge chunks`);
} catch (error) {
  console.error("Could not load mce-chunks.json:", error.message);
}

try {
  hostelMenu = JSON.parse(fs.readFileSync(menuPath, "utf8"));
  console.log("Hostel menu loaded successfully");
} catch (error) {
  console.error("Could not load menu.json:", error.message);
}

try {
  hostelFees = JSON.parse(fs.readFileSync(feesPath, "utf8"));
  console.log("Hostel fees loaded successfully");
} catch (error) {
  console.error("Could not load fees.json:", error.message);
}

function cleanScrapedText(text) {
  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .trim();
}

function searchKnowledge(query) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const results = chunks
    .map((chunk) => {
      const rawText = chunk.text || chunk.content || "";
      const text = cleanScrapedText(rawText).toLowerCase();

      let score = 0;

      // Basic word matching
      for (const word of words) {
        if (text.includes(word)) {
          score += 1;
        }
      }

      // Stronger scoring for important phrases
      const importantPhrases = [
        "admission process",
        "admission procedure",
        "admission eligibility",
        "eligibility criteria",
        "admission requirements",
        "application process",
        "admission 2026",
        "admission 2026-2027",
        "kcet admission",
        "comedk admission",
        "documents required",
        "documents during admission",
        "seat allotment",
      ];

      for (const phrase of importantPhrases) {
        if (query.toLowerCase().includes(phrase)) {
          if (text.includes(phrase)) {
            score += 10;
          }
        }
      }

      // Admission-specific boosting
      if (
        query.toLowerCase().includes("admission") &&
        text.includes("admission")
      ) {
        score += 5;
      }

      if (
        query.toLowerCase().includes("eligibility") &&
        text.includes("eligibility")
      ) {
        score += 8;
      }

      if (
        query.toLowerCase().includes("kcet") &&
        text.includes("kcet")
      ) {
        score += 10;
      }

      if (
        query.toLowerCase().includes("comedk") &&
        text.includes("comedk")
      ) {
        score += 10;
      }

      // Penalize obvious unrelated homepage/navigation content
      const unrelatedWords = [
        "placements",
        "alumni",
        "campus tour",
        "student club",
        "examination",
        "examination process",
        "latest news",
      ];

      for (const word of unrelatedWords) {
        if (text.includes(word)) {
          score -= 2;
        }
      }

      return {
        ...chunk,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return results.slice(0, 5);
}

function formatDay(day) {
  const data = hostelMenu.days?.[day];

  if (!data) {
    return null;
  }

  return `
📅 ${day.charAt(0).toUpperCase() + day.slice(1)}

🍳 Breakfast: ${data.breakfast}

🍛 Lunch: ${data.lunch}

☕ Evening Tea: ${data.eveningTea}

🍽️ Dinner: ${data.dinner}
`.trim();
}

function getTodayName() {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[new Date().getDay()];
}

function createSpecificMenuResponse(entities) {
  let day = entities?.day;
  const meal = entities?.meal;

  if (day === "today") {
    day = getTodayName();
  }

  if (!day) {
    return null;
  }

  const data = hostelMenu.days?.[day];

  if (!data) {
    return null;
  }

  let response = `🏠 MCE Boys Hostel — ${day
    .charAt(0)
    .toUpperCase() + day.slice(1)} Menu\n\n`;

  if (meal === "breakfast") {
    response += `🍳 Breakfast: ${data.breakfast}`;
  } else if (meal === "lunch") {
    response += `🍛 Lunch: ${data.lunch}`;
  } else if (meal === "eveningTea") {
    response += `☕ Evening Tea: ${data.eveningTea}`;
  } else if (meal === "dinner") {
    response += `🍽️ Dinner: ${data.dinner}`;
  } else {
    response += formatDay(day);
  }

  response += `\n\n📌 Source: MCE Boys Hostel Menu`;

  return response.trim();
}

function createMenuResponse(entities) {
  const specificResponse = createSpecificMenuResponse(entities);

  if (specificResponse) {
    return specificResponse;
  }

  return `
🏠 MCE Boys Hostel — Weekly Menu

⏰ Meal Timings

🍳 Breakfast: ${hostelMenu.timings.breakfast}
🍛 Lunch: ${hostelMenu.timings.lunch}
☕ Evening Tea: ${hostelMenu.timings.eveningTea}
🍽️ Dinner: ${hostelMenu.timings.dinner}

You can ask me about a specific day or meal.

For example:
• What is Monday breakfast?
• What is Tuesday dinner?
• What is Friday lunch?
• What is Sunday's menu?

📌 Source: MCE Boys Hostel Menu
`.trim();
}

function createFeesResponse(message) {
  const text = message.toLowerCase();
  const rooms = hostelFees.rooms || [];

  if (text.includes("2-bed") || text.includes("2 bed")) {
    const room = rooms.find((item) => item.beds === 2);

    if (room) {
      return `
🏠 MCE Hostel Fee

🛏️ ${room.type}
💰 Fee: ${room.fee}

📌 ${hostelFees.note}
`.trim();
    }
  }

  if (
    text.includes("single") ||
    text.includes("one bed") ||
    text.includes("1 bed")
  ) {
    const room = rooms.find(
      (item) => item.type.toLowerCase() === "single room"
    );

    if (room) {
      return `
🏠 MCE Hostel Fee

🛏️ ${room.type}
💰 Fee: ${room.fee}

📌 ${hostelFees.note}
`.trim();
    }
  }

  if (text.includes("special")) {
    const room = rooms.find((item) =>
      item.type.toLowerCase().includes("special")
    );

    if (room) {
      return `
🏠 MCE Hostel Fee

⭐ ${room.type}
💰 Fee: ${room.fee}

📌 ${hostelFees.note}
`.trim();
    }
  }

  let response = "🏠 MCE Hostel Fees\n\n";

  for (const room of rooms) {
    response += `🛏️ ${room.type}: ${room.fee}\n`;
  }

  response += `\n📌 ${hostelFees.note}`;

  return response.trim();
}

function createCourseResponse(course, level) {
  if (course) {
    return `
🎓 MCE Course Information

✅ ${course}

This program is offered at Malnad College of Engineering, Hassan.

📌 Source: Official Malnad College of Engineering website
`.trim();
  }

  if (level === "UG") {
    return `
🎓 MCE Undergraduate (UG) Programs

1. Information Science & Engineering
2. Computer Science & Engineering
3. Computer Science & Engineering (Artificial Intelligence & Machine Learning)
4. Computer Science and Business Systems
5. Robotics & Artificial Intelligence
6. Electronics & Communication Engineering
7. Electronics Engineering (VLSI Design & Technology)
8. Electrical & Electronics Engineering
9. Civil Engineering
10. Mechanical Engineering
11. Electronics and Computer Engineering

📌 Source: Official Malnad College of Engineering website
`.trim();
  }

  if (level === "PG") {
    return `
🎓 MCE Postgraduate (PG) Programs

1. Digital Electronics & Communication Systems
2. Computer Aided Design of Structures
3. Power & Energy System
4. Artificial Intelligence & Data Science
5. Master of Computer Applications (MCA)

📌 Source: Official Malnad College of Engineering website
`.trim();
  }

  if (level === "RESEARCH") {
    return `
🔬 MCE Research Programs

• Ph.D. & M.Sc. Engineering by Research

📌 Source: Official Malnad College of Engineering website
`.trim();
  }

  return `
🎓 Courses Offered at MCE

UG Programs:
1. Information Science & Engineering
2. Computer Science & Engineering
3. Computer Science & Engineering (Artificial Intelligence & Machine Learning)
4. Computer Science and Business Systems
5. Robotics & Artificial Intelligence
6. Electronics & Communication Engineering
7. Electronics Engineering (VLSI Design & Technology)
8. Electrical & Electronics Engineering
9. Civil Engineering
10. Mechanical Engineering
11. Electronics and Computer Engineering

PG Programs:
1. Digital Electronics & Communication Systems
2. Computer Aided Design of Structures
3. Power & Energy System
4. Artificial Intelligence & Data Science
5. Master of Computer Applications (MCA)

Research Programs:
• Ph.D. & M.Sc. Engineering by Research

📌 Source: Official Malnad College of Engineering website
`.trim();
}

function createHostelResponse() {
  return `
🏠 MCE Hostel Facilities

Malnad College of Engineering provides comfortable, secure, and fully-equipped hostel accommodation for both boys and girls.

👨‍🎓 Boys Hostel:
• Established in 1961, located inside the college campus close to departments and library.
• Capacity: Accommodates over 800+ students across multiple blocks.
• Facilities: Single room, 2-bed room, and special rooms with Wi-Fi connectivity.
• Amenities: TV recreation rooms, reading halls, indoor games (table tennis, chess, carrom), badminton and volleyball courts.
• Mess: Dedicated hygienic dining hall providing breakfast, lunch, evening tea, and dinner.

👩‍🎓 Girls Hostel:
• Established in 2008, an exclusive and secure ladies hostel located near the campus.
• Capacity: 44 well-furnished rooms accommodating 240+ students.
• Security: 24/7 round-the-clock CCTV surveillance and security staff.
• Amenities: Solar water heaters, continuous water/power supply, study hall, and hygienic mess facilities.

💰 Hostel Fees (Annual):
• 2-bed room: ₹70,000
• Single room: ₹75,000
• Special room: ₹1,10,000

📌 Tip: You can ask "What is today's hostel menu?" or "hostel fees" for more information.
📌 Source: Official Malnad College of Engineering website
`.trim();
}

app.get("/", (req, res) => {
  res.json({
    message: "MCE AI Chatbot Backend is running",
  });
});

app.post("/api/chat", (req, res) => {
  const message = req.body.message || "";

  if (!message.trim()) {
    return res.json({
      reply: "Please enter a question.",
    });
  }
// ========================================
// DIRECT MANAGEMENT QUOTA CHECK
// ========================================

const normalizedMessage = message
  .toLowerCase()
  .replace(/[?!.,]/g, " ")
  .replace(/\s+/g, " ")
  .trim();
// ========================================
// FORCE MANAGEMENT DOCUMENTS / CONTACT
// ========================================

if (
  normalizedMessage === "what documents are required for management quota" ||
  normalizedMessage === "what documents are required for management seat" ||
  normalizedMessage === "documents required for management quota" ||
  normalizedMessage === "documents required for management seat" ||
  normalizedMessage === "documents needed for management quota" ||
  normalizedMessage === "documents needed for management seat"
) {
  const managementDocumentInfo = mceKnowledge.find(
    (item) => item.type === "management_documents"
  );

  if (managementDocumentInfo) {
    console.log("DEBUG: MANAGEMENT DOCUMENT ANSWER");

    return res.json({
      reply: managementDocumentInfo.answer,
      intent: "ADMISSIONS",
      confidence: 1,
      entities: {
        admissionType: "MANAGEMENT_DOCUMENTS",
      },
      sources: [
        {
          title: managementDocumentInfo.question,
          url: "https://www.mcehassan.ac.in/home/Admission_Information",
        },
      ],
    });
  }
}

if (
  normalizedMessage === "what is the admission office phone number" ||
  normalizedMessage === "what is the admission office phone" ||
  normalizedMessage === "admission office phone number" ||
  normalizedMessage === "admission office phone" ||
  normalizedMessage === "admission office number"
) {
  const contactInfo = mceKnowledge.find(
    (item) =>
      (item.question || "")
        .toLowerCase()
        .includes("contact mce for admission")
  );

  if (contactInfo) {
    console.log("DEBUG: ADMISSION CONTACT ANSWER");

    return res.json({
      reply: contactInfo.answer,
      intent: "ADMISSIONS",
      confidence: 1,
      entities: {
        admissionType: "ADMISSION_CONTACT",
      },
      sources: [
        {
          title: contactInfo.question,
          url: "https://www.mcehassan.ac.in/home/Enquiry",
        },
      ],
    });
  }
}

// ========================================
// MANAGEMENT QUOTA DOCUMENTS
// ========================================
console.log("DEBUG: Checking MANAGEMENT QUOTA DOCUMENTS");
if (
  (
    normalizedMessage.includes("management quota") ||
    normalizedMessage.includes("management seat") ||
    normalizedMessage.includes("management seats") ||
    normalizedMessage.includes("management admission")
  ) &&
  (
    normalizedMessage.includes("document") ||
    normalizedMessage.includes("documents") ||
    normalizedMessage.includes("certificate") ||
    normalizedMessage.includes("certificates") ||
    normalizedMessage.includes("required") ||
    normalizedMessage.includes("need")
  )
) {
  const managementDocumentInfo = mceKnowledge.find(
    (item) => item.type === "management_documents"
  );

  if (managementDocumentInfo) {
    return res.json({
      reply: managementDocumentInfo.answer,
      intent: "ADMISSIONS",
      confidence: 1,
      entities: {
        admissionType: "MANAGEMENT_DOCUMENTS",
      },
      sources: [
        {
          title: managementDocumentInfo.question,
          url: "https://www.mcehassan.ac.in/home/Admission_Information",
        },
      ],
    });
  }
}


// ========================================
// MANAGEMENT QUOTA DOCUMENTS - SEAT VERSION
// ========================================

if (
  (
    normalizedMessage.includes("management seat") ||
    normalizedMessage.includes("management seats")
  ) &&
  (
    normalizedMessage.includes("document") ||
    normalizedMessage.includes("documents") ||
    normalizedMessage.includes("certificate") ||
    normalizedMessage.includes("certificates")
  )
) {
  const managementDocumentInfo = mceKnowledge.find(
    (item) => item.type === "management_documents"
  );

  if (managementDocumentInfo) {
    return res.json({
      reply: managementDocumentInfo.answer,

      intent: "ADMISSIONS",

      confidence: 1,

      entities: {
        admissionType: "MANAGEMENT_DOCUMENTS",
      },

      sources: [
        {
          title: managementDocumentInfo.question,
          url: "https://www.mcehassan.ac.in/home/Admission_Information",
        },
      ],
    });
  }
}


// ========================================
// ADMISSION ROUTE / WHERE TO GO
// ========================================

if (
  normalizedMessage.includes("admission route") ||
  normalizedMessage.includes("route for admission") ||
  normalizedMessage.includes("where to go for admission") ||
  normalizedMessage.includes("where should i go for admission") ||
  normalizedMessage.includes("where do i go for admission") ||
  normalizedMessage.includes("how do i go for admission") ||
  normalizedMessage.includes("show admission route") ||
  normalizedMessage.includes("steps for admission") ||
  normalizedMessage.includes("admission steps")
) {
  const routeInfo = mceKnowledge.find(
    (item) => item.type === "admission_route"
  );

  if (routeInfo) {
    return res.json({
      reply: routeInfo.answer,

      intent: "ADMISSIONS",

      confidence: 1,

      entities: {
        admissionType: "ADMISSION_ROUTE",
      },

      image: routeInfo.image,

      sources: [
        {
          title: "MCE Admission Open 2026-27",
          url: "https://www.mcehassan.ac.in/home/Admission_Information",
        },
      ],
    });
  }
}


// ========================================
// GENERAL ADMISSION DOCUMENTS
// ========================================

if (
  normalizedMessage.includes("documents") ||
  normalizedMessage.includes("document") ||
  normalizedMessage.includes("required documents") ||
  normalizedMessage.includes("documents required") ||
  normalizedMessage.includes("documents needed") ||
  normalizedMessage.includes("documents for admission") ||
  normalizedMessage.includes("what documents") ||
  normalizedMessage.includes("marks card") ||
  normalizedMessage.includes("allotment order")
) {
  const documentInfo = mceKnowledge.find(
    (item) => item.type === "general_documents"
  );

  if (documentInfo) {
    return res.json({
      reply: documentInfo.answer,

      intent: "ADMISSIONS",

      confidence: 1,

      entities: {
        admissionType: "DOCUMENTS",
      },

      sources: [
        {
          title: "MCE Admission Documents 2026-27",
          url: "https://www.mcehassan.ac.in/home/Admission_Information",
        },
      ],
    });
  }
}


// ========================================
// ADMISSION CONTACT
// ========================================

if (
normalizedMessage.includes("admission office phone number") ||
  normalizedMessage.includes("admission office phone") ||
  normalizedMessage.includes("phone number for admission") ||
  normalizedMessage.includes("admission office number") ||
  normalizedMessage.includes("admission phone") ||
  normalizedMessage.includes("admission contact") ||
  normalizedMessage.includes("contact admission") ||
  normalizedMessage.includes("admission enquiry") ||
  normalizedMessage.includes("admission inquiry") ||
  normalizedMessage.includes("admission office")
) {
  const contactInfo = mceKnowledge.find(
    (item) =>
      (item.question || "")
        .toLowerCase()
        .includes("contact mce for admission")
  );

  if (contactInfo) {
    return res.json({
      reply: contactInfo.answer,

      intent: "ADMISSIONS",

      confidence: 1,

      entities: {
        admissionType: "ADMISSION_CONTACT",
      },

      sources: [
        {
          title: contactInfo.question,
          url: "https://www.mcehassan.ac.in/home/Enquiry",
        },
      ],
    });
  }
}


// ========================================
// MANAGEMENT QUOTA
// ========================================

if (
  normalizedMessage.includes("management quota") ||
  normalizedMessage.includes("management admission") ||
  normalizedMessage.includes("management seats")
) {
  const managementInfo = mceKnowledge.find(
    (item) =>
      (item.question || "")
        .toLowerCase()
        .includes("management quota")
  );

  if (managementInfo) {
    return res.json({
      reply: `
🏫 Management Quota Admission

• MCE offers admission through Management (Non-Govt. Quota).

• Management seats are allotted on a first come first serve basis.

• Applications for management seats are received at the MTES Office, Hassan.

• Seats are allotted through the management admission process.

📌 Source: Official Malnad College of Engineering website
      `.trim(),

      intent: "ADMISSIONS",

      confidence: 1,

      entities: {
        admissionType: "MANAGEMENT_QUOTA",
      },

      sources: [
        {
          title: managementInfo.question,
          url: "https://www.mcehassan.ac.in/home/Enquiry",
        },
      ],
    });
  }
}


// ========================================
// KCET CODE
// ========================================

if (
  normalizedMessage.includes("kcet code") ||
  normalizedMessage.includes("cet code") ||
  normalizedMessage === "mce kcet" ||
  normalizedMessage === "mce kcet code" ||
  normalizedMessage === "mce cet code"
) {
  const kcetInfo = mceKnowledge.find(
    (item) => item.question === "What is the MCE KCET code?"
  );

  if (kcetInfo) {
    return res.json({
      reply: kcetInfo.answer,

      intent: "ADMISSIONS",

      confidence: 1,

      entities: {
        admissionType: "KCET_CODE",
      },

      sources: [
        {
          title: kcetInfo.question,
          url: "https://www.mcehassan.ac.in/home/Admission_Information",
        },
      ],
    });
  }
}


// ========================================
// COMEDK CODE
// ========================================

if (
  normalizedMessage.includes("comedk code") ||
  normalizedMessage.includes("comed-k code") ||
  normalizedMessage === "mce comedk code"
) {
  const comedkInfo = mceKnowledge.find(
    (item) => item.question === "What is the MCE COMEDK code?"
  );

  if (comedkInfo) {
    return res.json({
      reply: comedkInfo.answer,

      intent: "ADMISSIONS",

      confidence: 1,

      entities: {
        admissionType: "COMEDK_CODE",
      },

      sources: [
        {
          title: comedkInfo.question,
          url: "https://www.mcehassan.ac.in/home/Admission_Information",
        },
      ],
    });
  }
}


// ========================================
// NLP INTENT DETECTION
// ========================================

// ========================================
// NLP INTENT DETECTION
// ========================================

const nlpResult = detectIntent(message);
  console.log(
    `NLP Intent: ${nlpResult.intent} | Confidence: ${nlpResult.confidence}`
  );

  if (nlpResult.intent === "GREETING") {
    return res.json({
      reply: `
👋 Hello! I am the MCE AI Assistant for Malnad College of Engineering, Hassan.

I can help you with:
• 🎓 Courses & Programs (UG, PG, Research degrees)
• 📝 Admissions (CET / KCET, COMEDK, Management Quota, Routes & Documents)
• 💼 Placements (Packages, Recruiters & Training)
• 🏠 Hostel (Hostel facilities, Fees & Daily Mess Menus)
• 📞 Contact Numbers & College Information

How can I help you today?
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  if (nlpResult.intent === "COLLEGE_INFO") {
    return res.json({
      reply: `
🏛️ Malnad College of Engineering (MCE), Hassan

• Establishment: Established in 1960 as a joint venture between Govt. of India, Govt. of Karnataka, and Malnad Technical Education Society (MTES).
• Status: Autonomous Institution affiliated with Visvesvaraya Technological University (VTU), Belagavi.
• Principal: Dr. S. Pradeep
• Location: Salagame Road, Hassan, Karnataka - 573202
• Campus: 44-acre green campus with advanced laboratories, library, ME-RIISE Foundation incubation cell, sports complex, and on-campus hostels.
• Accreditations: Accredited by NBA and NAAC.

📌 Source: Official Malnad College of Engineering website (https://www.mcehassan.ac.in)
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
      sources: [
        {
          title: "Malnad College of Engineering Official Website",
          url: "https://www.mcehassan.ac.in/",
        },
      ],
    });
  }

  if (nlpResult.intent === "PLACEMENTS") {
    return res.json({
      reply: `
💼 Placements at MCE Hassan

Malnad College of Engineering maintains an excellent placement track record guided by its dedicated Training and Placement Office (TPO).

🌟 Placement Highlights:
• Highest Package: Up to ₹11 LPA
• Offers: 350+ to 600+ campus offers annually across circuit and core engineering branches.
• Training Programs: Mandatory soft skills & aptitude training, programming bootcamps (C, C++, Java, Python), mock interviews, and career counseling for GATE/higher studies.

🏢 Top Recruiters:
• IT & Tech: TCS, Infosys, Wipro, IBM, Accenture, Tech Mahindra, Mindtree, Capgemini
• Core & Automotive: Mercedes-Benz, Robert Bosch, Toyota Kirloskar, Siemens, Toshiba, Tata Elxsi, L&T, BEL (Bharat Electronics Ltd.)
• Healthcare & Telecom: GE Healthcare, Schneider Electric, Honeywell, Dish Network

📌 Source: MCE Training & Placement Cell (https://www.mcehassan.ac.in/home/Placement-Records)
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
      sources: [
        {
          title: "MCE Training and Placement Records",
          url: "https://www.mcehassan.ac.in/home/Placement-Records",
        },
      ],
    });
  }

  if (nlpResult.intent === "CONTACT") {
    return res.json({
      reply: `
📞 MCE Contact Information

🏛️ Malnad College of Engineering
Salagame Road, Rangoli Halla, Hassan, Karnataka 573202

• MTES Office (Management & Admissions): 08172-268371
• Principal's Office: 08172-245317 / 08172-245093
• Dean (Student Affairs): +91 9449689093
• PRO / Institutional Promotions: +91 9141305843
• Email: office@mcehassan.ac.in
• Website: https://www.mcehassan.ac.in

🕐 Office Working Hours:
• Monday to Friday: 9:30 AM to 5:30 PM
• Saturday: 9:30 AM to 1:30 PM

📌 Source: Official Malnad College of Engineering website
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
      sources: [
        {
          title: "MCE Contact & Enquiry",
          url: "https://www.mcehassan.ac.in/home/Enquiry",
        },
      ],
    });
  }

if (nlpResult.intent === "MEAL_TIMINGS") {
  const meal = nlpResult.entities?.meal;

  if (meal === "breakfast") {
    return res.json({
      reply: `
⏰ Breakfast Timing

🍳 Breakfast: ${hostelMenu.timings.breakfast}

📌 Source: MCE Boys Hostel Menu
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  if (meal === "lunch") {
    return res.json({
      reply: `
⏰ Lunch Timing

🍛 Lunch: ${hostelMenu.timings.lunch}

📌 Source: MCE Boys Hostel Menu
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  if (meal === "eveningTea") {
    return res.json({
      reply: `
⏰ Evening Tea Timing

☕ Evening Tea: ${hostelMenu.timings.eveningTea}

📌 Source: MCE Boys Hostel Menu
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  if (meal === "dinner") {
    return res.json({
      reply: `
⏰ Dinner Timing

🍽️ Dinner: ${hostelMenu.timings.dinner}

📌 Source: MCE Boys Hostel Menu
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  return res.json({
    reply: `
⏰ MCE Boys Hostel Meal Timings

🍳 Breakfast: ${hostelMenu.timings.breakfast}
🍛 Lunch: ${hostelMenu.timings.lunch}
☕ Evening Tea: ${hostelMenu.timings.eveningTea}
🍽️ Dinner: ${hostelMenu.timings.dinner}

📌 Source: MCE Boys Hostel Menu
`.trim(),
    intent: nlpResult.intent,
    confidence: nlpResult.confidence,
    entities: nlpResult.entities,
  });
}
  if (nlpResult.intent === "HOSTEL_FEE") {
    return res.json({
      reply: createFeesResponse(message),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  if (nlpResult.intent === "HOSTEL_MENU") {
    return res.json({
      reply: createMenuResponse(nlpResult.entities),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
      image: "/hostel/hostel-menu.png",
    });
  }

 if (nlpResult.intent === "COURSES") {
  return res.json({
    reply: createCourseResponse(
      nlpResult.entities?.course,
      nlpResult.entities?.level
    ),
    intent: nlpResult.intent,
    confidence: nlpResult.confidence,
    entities: nlpResult.entities,
  });
}
if (nlpResult.intent === "ADMISSIONS") {
  const admissionType = nlpResult.entities?.admissionType;
  const entranceExam = nlpResult.entities?.entranceExam;

  
  let bestMatch = null;
  let bestScore = 0;

  for (const item of mceKnowledge) {
    const question = (item.question || "").toLowerCase();

    const keywords = (item.keywords || []).map((keyword) =>
      keyword.toLowerCase()
    );

    let score = 0;

    // Exact question
    if (normalizedMessage === question) {
      score += 100;
    }

    // Keyword matching
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        score += 20;
      }
    }

    // Specific question matching
    if (
      normalizedMessage.includes("management quota") &&
      question.includes("management quota")
    ) {
      score += 100;
    }

    if (
      normalizedMessage.includes("management") &&
      question.includes("management")
    ) {
      score += 60;
    }

    if (
      normalizedMessage.includes("document") &&
      question.includes("document")
    ) {
      score += 100;
    }

    if (
      normalizedMessage.includes("eligibility") &&
      question.includes("eligibility")
    ) {
      score += 100;
    }

    if (
      normalizedMessage.includes("comedk") &&
      question.includes("comedk")
    ) {
      score += 100;
    }

    if (
      (
        normalizedMessage.includes("kcet") ||
        normalizedMessage.includes("cet")
      ) &&
      (
        question.includes("kcet") ||
        question.includes("cet")
      )
    ) {
      score += 100;
    }

    if (
      normalizedMessage.includes("contact") &&
      question.includes("contact")
    ) {
      score += 100;
    }

    if (
      normalizedMessage.includes("2026") &&
      question.includes("2026")
    ) {
      score += 100;
    }

    if (
      normalizedMessage.includes("code") &&
      question.includes("code")
    ) {
      score += 100;
    }

    if (admissionType === "PROCESS") {
      if (
        question.includes("admission process") ||
        question.includes("how can i get admission")
      ) {
        score += 80;
      }
    }

    if (admissionType === "ELIGIBILITY") {
      if (question.includes("eligibility")) {
        score += 80;
      }
    }

    if (entranceExam === "KCET") {
      if (
        question.includes("kcet") ||
        question.includes("cet")
      ) {
        score += 80;
      }
    }

    if (entranceExam === "COMEDK") {
      if (question.includes("comedk")) {
        score += 80;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // ========================================
  // FORMAT ANSWERS
  // ========================================

  if (bestMatch && bestScore >= 20) {
    let formattedAnswer = bestMatch.answer;

    // Management quota
    if (
      bestMatch.question
        .toLowerCase()
        .includes("management quota")
    ) {
      formattedAnswer = `
🏫 Management Quota Admission

• MCE offers admission through Management (Non-Govt. Quota).

• Management seats are allotted on a first come first serve basis.

• Applications for management seats are received at the MTES Office, Hassan.

• Seats are allotted through the management admission process.
      `.trim();
    }

    // Admission process
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("admission process")
    ) {
      formattedAnswer = `
📝 MCE Admission Process

• MCE offers admission through CET (Government Quota) and Management (Non-Government Quota).

• CET admission is through the Common Entrance Test (CET) conducted by the Department for Technical Education in Karnataka.

• Online application and seat allotment are processed by the KEA cell.

• Students selected for MCE can come directly to the college Admission Block with their Admission order.
      `.trim();
    }

    // CET
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("cet")
    ) {
      formattedAnswer = `
🎓 CET / Government Quota Admission

• Admission is through the Common Entrance Test (CET).

• CET is conducted by the Department for Technical Education in Karnataka.

• Online application and seat allotment are processed by the KEA cell.

• Selected students can come to the MCE Admission Block with their Admission order.
      `.trim();
    }

    // Eligibility
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("eligibility")
    ) {
      formattedAnswer = `
✅ Admission Eligibility

• MCE publishes eligibility requirements according to the admission route and applicable rules.

• For the 2025-26 information published by MCE, B.E. aided courses list 10+2 with 45% plus UG CET.

• Eligibility can vary according to category and admission route.

• Students should check the latest MCE and KEA notification for the applicable academic year.
      `.trim();
    }

    // Documents
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("documents")
    ) {
      formattedAnswer = `
📄 Documents Required for Admission

The MCE admission document list includes:

• KEA Confirmation Slip

• KEA CET / D-CET 2025 Online Application Form (Final Copy)

• CET / COMED-K / D-CET Allotment Order

• 12th / PUC / Diploma Marks Card

• 10th / SSLC Marks Card

• Caste & Income Certificate, if applicable

• Additional certificates may be required for categories such as Rural quota, Kannada Medium, Hyderabad Karnataka, Sports, Physically Handicapped, NCC, Defence and Ex-Defence.

📌 Students should check the latest admission notice for the current year's requirements.
      `.trim();
    }

    // COMEDK
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("comedk")
    ) {
      formattedAnswer = `
🎓 COMED-K Admission

• MCE publishes admission notifications related to COMED-K seats.

• Notifications may include unfilled COMED-K seats under Management Quota.

• Availability of seats can change each academic year.

• Students should check the latest official MCE admission notification.
      `.trim();
    }

    // KCET CODE
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("kcet code")
    ) {
      formattedAnswer = `
🔢 MCE KCET Codes

• Aided: E-024

• Un-Aided: E-047
      `.trim();
    }

    // COMEDK CODE
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("comedk code")
    ) {
      formattedAnswer = `
🔢 MCE COMED-K Code

• COMED-K Code: E-079
      `.trim();
    }

    // CONTACT
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("contact")
    ) {
      formattedAnswer = `
📞 MCE Admission Contact

• MTES Office, Hassan: 08172-268371

• Principal's Office: 08172-245317

• Dean Student Affairs: 9449689093

• Email: office@mcehassan.ac.in
      `.trim();
    }

    // 2026-27
    else if (
      bestMatch.question
        .toLowerCase()
        .includes("2026-27")
    ) {
      formattedAnswer = `
📅 MCE Admission Information 2026-27

• Admission Notice 2026-27 – Process is available.

• MCE has also published information regarding 2026-27 Management Quota seats.

• The prescribed fee structure is provided in the official admission information.

• Students should check the latest official MCE admission notice for current seats, fees and procedures.
      `.trim();
    }

    return res.json({
      reply: `${formattedAnswer}

📌 Source: Official Malnad College of Engineering website`,

      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,

      sources: [
        {
          title: bestMatch.question,
          url: "https://www.mcehassan.ac.in/home/Enquiry",
        },
      ],
    });
  }

  // ========================================
  // NO MATCH
  // ========================================

  return res.json({
    reply: `
📝 MCE Admissions

I couldn't find a specific answer to that admission question.

You can ask about:

• Admission process
• CET / KCET admission
• Management quota
• Eligibility
• Required documents
• COMEDK
• KCET code
• COMEDK code
• Admission contacts
• 2026-27 admission information

📌 Source: Official Malnad College of Engineering website
    `.trim(),

    intent: nlpResult.intent,
    confidence: nlpResult.confidence,
    entities: nlpResult.entities,
  });
}

  if (nlpResult.intent === "HOSTEL_FACILITIES") {
    return res.json({
      reply: createHostelResponse(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  const results = searchKnowledge(message);

  if (!results.length) {
    return res.json({
      reply: `
I couldn't find an exact match in the MCE knowledge base. You can try asking about:
• 🎓 Courses & Programs (e.g. "What courses are offered at MCE?")
• 📝 Admission procedures & eligibility (e.g. "What is the admission process?", "Management quota")
• 💼 Campus placements & recruiters (e.g. "Tell me about placements")
• 🏠 Hostel facilities, fees & menu (e.g. "Tell me about hostel facilities", "Hostel fees")
• 📞 Contact details & office hours (e.g. "College contact number")
`.trim(),
      intent: nlpResult.intent,
      confidence: nlpResult.confidence,
      entities: nlpResult.entities,
    });
  }

  const bestResult = results[0];

  res.json({
    reply: cleanScrapedText(
      bestResult.text || bestResult.content || ""
    ),
    intent: nlpResult.intent,
    confidence: nlpResult.confidence,
    entities: nlpResult.entities,
    sources: results.map((item) => ({
      title: item.title || "",
      url: item.url || "",
    })),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `MCE AI Chatbot Backend running on http://localhost:${PORT}`
  );
});