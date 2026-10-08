// ========================================
// MCE AI CHATBOT - INTENT DETECTOR
// ========================================


// ========================================
// TEXT NORMALIZATION
// ========================================

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")

    // Common spelling mistakes
    .replace(/\bmanagment\b/g, "management")
    .replace(/\bmanegement\b/g, "management")
    .replace(/\bmanagemnt\b/g, "management")

    .replace(/\bqoata\b/g, "quota")
    .replace(/\bquata\b/g, "quota")
    .replace(/\bquoto\b/g, "quota")

    // Government abbreviations
    .replace(/\bnon[\s-]?govt\b/g, "non government")
    .replace(/\bnon[\s-]?government\b/g, "non government")

    // Management abbreviation
    .replace(/\bmgmt\b/g, "management");
}


// ========================================
// HELPER FUNCTION
// ========================================

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}


// ========================================
// EXTRACT ENTITIES
// ========================================

function extractEntities(message) {
  const text = normalizeText(message);

  // -----------------------------
  // DAY
  // -----------------------------

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  let day = null;

  for (const item of days) {
    if (text.includes(item)) {
      day = item;
      break;
    }
  }

  if (text.includes("today") || text.includes("tonight")) {
    day = "today";
  }


  // -----------------------------
  // MEAL
  // -----------------------------

  let meal = null;

  if (
    text.includes("breakfast") ||
    text.includes("morning")
  ) {
    meal = "breakfast";

  } else if (
    text.includes("lunch") ||
    text.includes("afternoon")
  ) {
    meal = "lunch";

  } else if (
    text.includes("tea") ||
    text.includes("snack") ||
    text.includes("evening")
  ) {
    meal = "eveningTea";

  } else if (
    text.includes("dinner") ||
    text.includes("tonight") ||
    text.includes("night")
  ) {
    meal = "dinner";
  }


  // -----------------------------
  // COURSE
  // -----------------------------

  let course = null;

  const coursePatterns = [
    {
      name: "Information Science & Engineering",
      patterns: [
        "information science",
        "information science engineering",
        "ise",
      ],
    },

    {
      name: "Computer Science & Engineering",
      patterns: [
        "computer science",
        "computer science engineering",
        "cse",
      ],
    },

    {
      name: "Computer Science & Engineering (Artificial Intelligence & Machine Learning)",
      patterns: [
        "artificial intelligence and machine learning",
        "artificial intelligence machine learning",
        "ai and ml",
        "ai ml",
        "aiml",
        "cse ai ml",
      ],
    },

    {
      name: "Computer Science and Business Systems",
      patterns: [
        "computer science and business systems",
        "business systems",
        "csbs",
      ],
    },

    {
      name: "Robotics & Artificial Intelligence",
      patterns: [
        "robotics",
        "robotics artificial intelligence",
        "robotics ai",
      ],
    },

    {
      name: "Electronics & Communication Engineering",
      patterns: [
        "electronics and communication",
        "electronics communication",
        "ece",
      ],
    },

    {
      name: "Electronics Engineering (VLSI Design & Technology)",
      patterns: [
        "vlsi",
        "vlsi design",
        "vlsi technology",
        "electronics vlsi",
      ],
    },

    {
      name: "Electrical & Electronics Engineering",
      patterns: [
        "electrical and electronics",
        "electrical electronics",
        "eee",
      ],
    },

    {
      name: "Civil Engineering",
      patterns: [
        "civil",
        "civil engineering",
      ],
    },

    {
      name: "Mechanical Engineering",
      patterns: [
        "mechanical",
        "mechanical engineering",
      ],
    },

    {
      name: "Electronics and Computer Engineering",
      patterns: [
        "electronics and computer engineering",
        "electronics computer engineering",
        "electronics computer",
      ],
    },

    {
      name: "Digital Electronics & Communication Systems",
      patterns: [
        "digital electronics",
        "digital electronics communication",
        "decs",
      ],
    },

    {
      name: "Computer Aided Design of Structures",
      patterns: [
        "computer aided design",
        "cad structures",
        "computer aided design of structures",
      ],
    },

    {
      name: "Power & Energy System",
      patterns: [
        "power and energy",
        "power energy",
        "power energy system",
      ],
    },

    {
      name: "Artificial Intelligence & Data Science",
      patterns: [
        "artificial intelligence and data science",
        "ai and data science",
        "ai data science",
        "aids",
      ],
    },

    {
      name: "Master of Computer Applications (MCA)",
      patterns: [
        "mca",
        "master of computer applications",
        "computer applications",
      ],
    },
  ];

  for (const item of coursePatterns) {
    if (hasAny(text, item.patterns)) {
      course = item.name;
      break;
    }
  }


  // -----------------------------
  // LEVEL
  // -----------------------------

  let level = null;

  if (
    text.includes("undergraduate") ||
    text.includes("ug")
  ) {
    level = "UG";

  } else if (
    text.includes("postgraduate") ||
    text.includes("pg")
  ) {
    level = "PG";

  } else if (
    text.includes("research") ||
    text.includes("phd") ||
    text.includes("m sc") ||
    text.includes("msc")
  ) {
    level = "RESEARCH";
  }


  // -----------------------------
  // ADMISSION TYPE
  // -----------------------------

  let admissionType = null;

  // Management admission
  if (
    text.includes("management seat") ||
    text.includes("management seats") ||
    text.includes("management quota") ||
    text.includes("management admission") ||
    text.includes("management category") ||
    text.includes("direct admission") ||
    text.includes("private admission") ||
    text.includes("non government quota") ||
    text.includes("non government admission")
  ) {
    admissionType = "MANAGEMENT_QUOTA";

  } else if (
    text.includes("admission process") ||
    text.includes("admission procedure") ||
    text.includes("how to get admission") ||
    text.includes("how can i get admission") ||
    text.includes("how can i join") ||
    text.includes("how to join")
  ) {
    admissionType = "PROCESS";

  } else if (
    text.includes("eligibility") ||
    text.includes("eligible") ||
    text.includes("eligibility criteria")
  ) {
    admissionType = "ELIGIBILITY";

  } else if (
    text.includes("application") ||
    text.includes("apply")
  ) {
    admissionType = "APPLICATION";
  }


  // -----------------------------
  // ENTRANCE EXAM
  // -----------------------------

  let entranceExam = null;

  if (
    text.includes("kcet") ||
    text.includes("kcet exam")
  ) {
    entranceExam = "KCET";

  } else if (
    text.includes("comedk") ||
    text.includes("comed k")
  ) {
    entranceExam = "COMEDK";

  } else if (
    text.includes("jee") ||
    text.includes("jee main")
  ) {
    entranceExam = "JEE";
  }


  return {
    day,
    meal,
    course,
    level,
    admissionType,
    entranceExam,
  };
}


// ========================================
// DETECT INTENT
// ========================================

function detectIntent(message) {
  let text = normalizeText(message);

  const entities = extractEntities(message);


  // ========================================
  // HANDLE COMBINED WORDS
  // ========================================

  text = text
    .replace(/managementseat/g, "management seat")
    .replace(/managementseats/g, "management seats")
    .replace(/managementquota/g, "management quota")
    .replace(/managementadmission/g, "management admission")
    .replace(/managementcategory/g, "management category")
    .replace(/non-government/g, "non government")
    .replace(/non-govt/g, "non government");


  // ========================================
  // MANAGEMENT ADMISSION NLP
  // ========================================

  const managementWords = [
    "management",
    "direct admission",
    "private admission",
    "non government",
  ];

  const managementAdmissionWords = [
    "management seat",
    "management seats",
    "management quota",
    "management admission",
    "management category",
    "direct admission",
    "private admission",
    "non government quota",
    "non government admission",
  ];

  const documentWords = [
    "document",
    "documents",
    "certificate",
    "certificates",
    "paper",
    "papers",
    "required document",
    "required documents",
    "documents required",
    "documents needed",
    "document needed",
    "certificate required",
    "certificates required",
  ];

  const hasManagement =
    hasAny(text, managementWords);

  const hasManagementAdmission =
    hasAny(text, managementAdmissionWords);

  const hasManagementDocuments =
    hasAny(text, documentWords);


  // ========================================
  // MANAGEMENT DOCUMENTS
  // ========================================

  if (
    hasManagement &&
    hasManagementAdmission &&
    hasManagementDocuments
  ) {
    return {
      intent: "ADMISSIONS",
      confidence: 0.99,
      entities: {
        ...entities,
        admissionType: "MANAGEMENT_DOCUMENTS",
      },
    };
  }


  // ========================================
  // MANAGEMENT QUOTA / SEAT
  // ========================================

  if (
    hasManagement &&
    hasManagementAdmission
  ) {
    return {
      intent: "ADMISSIONS",
      confidence: 0.97,
      entities: {
        ...entities,
        admissionType: "MANAGEMENT_QUOTA",
      },
    };
  }


  // ==========================================
  // GREETINGS
  // ==========================================

  const greetingWords = [
    "hi",
    "hello",
    "hey",
    "heya",
    "hola",
    "namaste",
    "good morning",
    "good afternoon",
    "good evening",
    "how are you",
    "who are you",
    "what can you do",
    "help",
  ];

  if (
    greetingWords.some(
      (g) => text === g || text.startsWith(g + " ") || text.endsWith(" " + g)
    )
  ) {
    return {
      intent: "GREETING",
      confidence: 0.99,
      entities,
    };
  }


  // ==========================================
  // COLLEGE INFO / ABOUT MCE / PRINCIPAL
  // ==========================================

  const collegeInfoWords = [
    "about mce",
    "about malnad",
    "about the college",
    "tell me about mce",
    "tell me about college",
    "principal",
    "who is principal",
    "who is the principal",
    "autonomous",
    "vtu",
    "when was mce established",
    "history of mce",
    "where is mce",
    "location of mce",
    "where is the college located",
    "campus",
    "accreditation",
    "nirf",
  ];

  if (hasAny(text, collegeInfoWords)) {
    return {
      intent: "COLLEGE_INFO",
      confidence: 0.95,
      entities,
    };
  }


  // ==========================================
  // MEAL TIMINGS
  // ==========================================

  const timingWords = [
    "timing",
    "timings",
    "time",
    "when",
    "schedule",
  ];

  const mealWords = [
    "breakfast",
    "lunch",
    "tea",
    "snack",
    "evening",
    "dinner",
    "meal",
    "meals",
  ];

  if (
    hasAny(text, timingWords) &&
    hasAny(text, mealWords)
  ) {
    return {
      intent: "MEAL_TIMINGS",
      confidence: 0.98,
      entities,
    };
  }

  if (
    text.includes("meal timings") ||
    text.includes("meal timing") ||
    text.includes("food timings") ||
    text.includes("hostel timings")
  ) {
    return {
      intent: "MEAL_TIMINGS",
      confidence: 0.98,
      entities,
    };
  }


  // ==========================================
  // HOSTEL FEE
  // ==========================================

  const feeWords = [
    "fee",
    "fees",
    "cost",
    "price",
    "pay",
    "payment",
    "amount",
    "charge",
    "rent",
    "stay",
    "staying",
  ];

  const hostelWords = [
    "hostel",
    "room",
    "accommodation",
    "boarding",
    "stay",
    "staying",
  ];

  if (
    hasAny(text, feeWords) &&
    hasAny(text, hostelWords)
  ) {
    return {
      intent: "HOSTEL_FEE",
      confidence: 0.95,
      entities,
    };
  }

  if (
    text.includes("hostel fee") ||
    text.includes("hostel fees") ||
    text.includes("hostel cost") ||
    text.includes("hostel price") ||
    text.includes("room fee") ||
    text.includes("room cost") ||
    text.includes("how much hostel") ||
    text.includes("how much is hostel")
  ) {
    return {
      intent: "HOSTEL_FEE",
      confidence: 0.95,
      entities,
    };
  }


  // ==========================================
  // HOSTEL MENU
  // ==========================================

  const foodWords = [
    "food",
    "eat",
    "eating",
    "serve",
    "served",
    "breakfast",
    "lunch",
    "dinner",
    "meal",
    "meals",
    "menu",
    "tea",
    "dish",
    "dishes",
  ];

  if (entities.day || entities.meal) {
    if (
      hasAny(text, foodWords) ||
      hasAny(text, [
        "what",
        "which",
        "available",
        "serve",
        "served",
      ])
    ) {
      return {
        intent: "HOSTEL_MENU",
        confidence: 0.95,
        entities,
      };
    }
  }

  if (
    hasAny(text, foodWords) &&
    (
      hasAny(text, [
        "hostel",
        "mess",
        "food",
        "meal",
        "menu",
      ]) ||
      hasAny(text, [
        "today",
        "tonight",
        "morning",
        "afternoon",
        "evening",
        "night",
      ])
    )
  ) {
    return {
      intent: "HOSTEL_MENU",
      confidence: 0.95,
      entities,
    };
  }


  // ==========================================
  // HOSTEL FACILITIES
  // ==========================================

  if (
    text.includes("hostel") &&
    hasAny(text, [
      "facility",
      "facilities",
      "accommodation",
      "building",
      "warden",
      "wifi",
      "internet",
      "water",
      "room",
      "rooms",
      "security",
      "canteen",
      "dining",
    ])
  ) {
    return {
      intent: "HOSTEL_FACILITIES",
      confidence: 0.90,
      entities,
    };
  }


  // ==========================================
  // COURSES
  // ==========================================

  if (
    entities.course ||
    hasAny(text, [
      "course",
      "courses",
      "program",
      "programs",
      "degree",
      "degrees",
      "branch",
      "branches",
      "department",
      "departments",
      "stream",
      "streams",
    ])
  ) {
    return {
      intent: "COURSES",
      confidence: 0.95,
      entities,
    };
  }


  // ==========================================
  // ADMISSIONS
  // ==========================================

  if (
    hasAny(text, [
      "admission",
      "admissions",
      "eligibility",
      "apply",
      "application",
      "entrance",
      "cet",
      "comedk",
      "joining",
    ])
  ) {
    return {
      intent: "ADMISSIONS",
      confidence: 0.90,
      entities,
    };
  }


  // ==========================================
  // PLACEMENTS
  // ==========================================

  if (
    hasAny(text, [
      "placement",
      "placements",
      "recruiter",
      "recruiters",
      "salary",
      "package",
      "companies",
      "job",
      "jobs",
      "career",
    ])
  ) {
    return {
      intent: "PLACEMENTS",
      confidence: 0.90,
      entities,
    };
  }


  // ==========================================
  // CONTACT
  // ==========================================

  if (
    hasAny(text, [
      "contact",
      "phone",
      "number",
      "mobile",
      "email",
      "address",
      "location",
    ])
  ) {
    return {
      intent: "CONTACT",
      confidence: 0.85,
      entities,
    };
  }


  // ==========================================
  // GENERAL
  // ==========================================

  return {
    intent: "GENERAL",
    confidence: 0.50,
    entities,
  };
}


// ========================================
// EXPORT
// ========================================

module.exports = {
  normalizeText,
  detectIntent,
  extractEntities,
};