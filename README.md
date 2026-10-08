# MCE AI Chatbot 🤖

An intelligent Full-Stack AI Chatbot Assistant for **Malnad College of Engineering (MCE), Hassan**, built to provide prospective students, parents, and current students with instant, accurate answers about admissions, courses, placements, hostel facilities, fees, and campus services.

---

## 🌟 Key Features

- **🎓 Academic Programs & Courses**: Complete details on undergraduate (UG), postgraduate (PG), and doctoral research programs.
- **📝 Admissions Guide**: Information regarding KCET, COMEDK, Management Quota, required documentation, and step-by-step admission routes.
- **💼 Placement Insights**: Accurate placement records, highest package metrics (up to ₹11 LPA), and major campus recruiters (Mercedes-Benz, Bosch, TCS, Infosys, BEL, L&T, etc.).
- **🏠 Hostel Administration**: Complete overview of Boys and Girls hostels, fee schedules, amenities, and daily mess menus.
- **📞 Direct Contacts & Office Directory**: Key contact details for MTES office, Principal's office, Dean of Student Affairs, and institutional enquiry channels.
- **💬 Modern Interactive UI**: React + Vite interface with real-time thinking indicator, quick suggestion chips, auto-scrolling chat history, and new chat reset.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Vanilla CSS, modern responsive design.
- **Backend**: Node.js, Express 5, CORS, custom NLP Intent Detection engine.
- **Knowledge Base**: Curated datasets for MCE admissions, hostel menu/fees, academic chunks, and crawler utilities.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)

### 2. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/manikantpujeri72-oss/AI_Chatbot.git
cd AI_Chatbot

# Install backend dependencies
cd mce-ai-chatbot/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Running the Application

You can run both backend and frontend from their respective directories:

#### Start Backend Server:
```bash
cd mce-ai-chatbot/backend
npm start
```
*Backend runs on: `http://localhost:5000`*

#### Start Frontend Application:
```bash
cd mce-ai-chatbot/frontend
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 📁 Project Structure

```
AI_Chatbot/
├── mce-ai-chatbot/
│   ├── backend/
│   │   ├── crawler/              # Web crawling & data processing scripts
│   │   ├── data/                 # Knowledge base, hostel menus, fees, & scraped chunks
│   │   ├── nlp/                  # Intent detector and entity extraction
│   │   ├── server.js             # Express API server & chat endpoints
│   │   └── package.json
│   └── frontend/
│       ├── public/               # Static assets, icons, and diagrams
│       ├── src/
│       │   ├── App.jsx           # Main chat interface component
│       │   ├── App.css           # Chat styling and animations
│       │   └── main.jsx
│       ├── vite.config.js        # Vite configuration with /api proxy
│       └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.