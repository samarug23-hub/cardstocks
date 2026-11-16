# 📚 Cardstock – AI Study Assistant

**Turn your notes into interactive flashcards and quizzes with AI.**

Cardstock is an AI-powered study assistant that helps students learn more effectively by transforming study notes into interactive flashcards and quizzes. It uses Google's Gemini API to generate structured learning content and allows users to retest themselves on questions they previously answered incorrectly.

## 🚀 Features

- **AI-Powered Flashcards:** Convert your notes into interactive flashcards.
- **Smart Quiz Generation:** Automatically generate quizzes from your study materials.
- **Retest Missed Questions:** Practice incorrect answers again to improve retention.
- **Structured AI Output:** Validate AI-generated JSON responses to ensure reliable content.
- **Error Handling:** Handle malformed model responses, request timeouts, and stale API responses.
- **Secure API Integration:** Keep the Gemini API key on the server side using an Express backend.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| JavaScript | Application logic |
| Node.js | Backend runtime |
| Express.js | Backend API and proxy |
| Gemini API | AI-powered content generation |
| Vite | Frontend development and build tool |

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/samarug23-hub/cardstocks.git
```

### 2. Navigate to the Project

```bash
cd cardstocks
```

### 3. Install Dependencies

Install the frontend and backend dependencies according to their respective `package.json` files.

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in your backend directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

**Important:** Never expose your API key in frontend code or upload your `.env` file to GitHub.

### 5. Run the Application

Start the backend and frontend using the development scripts defined in their respective `package.json` files.

## 📂 Project Overview

The application follows a client-server architecture:

- **Frontend:** Provides the interface for entering notes, viewing flashcards, and attempting quizzes.
- **Backend:** Handles API requests and communicates securely with the Gemini API.
- **AI Integration:** Generates flashcards and quizzes using structured model responses.
- **Validation:** Checks generated responses and handles invalid or incomplete output.

## 🔐 Security and Reliability

- API keys are stored on the backend.
- AI-generated responses are validated before being displayed.
- Request timeouts are handled to improve reliability.
- Stale responses are managed to prevent outdated results from replacing newer content.

## 🎯 Project Objective

The goal of Cardstock is to make studying more interactive, efficient, and personalized through AI-powered learning tools.

## 👨‍💻 Author

**Samar Chandra Biswas**

- GitHub: [@samarug23-hub](https://github.com/samarug23-hub)

---

⭐ If you find this project useful, consider giving the repository a star!
