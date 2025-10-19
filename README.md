# CollabCanvas MVP

Real-time collaborative canvas application - A Figma clone with multiplayer functionality.

## Project Overview

CollabCanvas is a 24-hour MVP school project that demonstrates real-time collaborative design capabilities. Users can simultaneously create, move, and manipulate shapes while seeing each other's cursors and presence in real-time.

## Tech Stack

- **Frontend:** React + Vite
- **Canvas:** Konva.js + React-Konva  
- **Backend:** Firebase (Firestore + Auth)
- **Real-time:** Firebase real-time listeners
- **Testing:** Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Copy Firebase config from Project Settings

4. Configure environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```bash
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # OpenAI Configuration (for AI Agent feature)
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   
   # LangSmith Configuration (optional)
   VITE_LANGSMITH_API_KEY=your_langsmith_api_key_here
   VITE_LANGSMITH_ENDPOINT=https://api.smith.langchain.com
   VITE_LANGSMITH_PROJECT=CollabCanvas-AI-Agent
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5173 in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Features (MVP)

- ✅ Real-time multiplayer cursors with names
- ✅ Rectangle creation by dragging
- ✅ Object movement and manipulation
- ✅ Pan and zoom canvas (4000x4000px)
- ✅ User authentication (email/password)
- ✅ Presence awareness (online users)
- ✅ State persistence across sessions
- ✅ Single global shared canvas

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth/           # Login/Signup components
│   ├── Canvas/         # Canvas and drawing components
│   ├── Collaboration/  # Multiplayer components
│   └── Layout/         # Header/Sidebar components
├── hooks/              # Custom React hooks
├── services/           # Firebase services
├── utils/              # Utility functions
└── __tests__/         # Test files
```

## Development Timeline

This is a 24-hour school project MVP with the following PR breakdown:

1. **PR #1:** Project Setup & Deployment (1-2h)
2. **PR #2:** User Authentication (2-3h) 
3. **PR #3:** Basic Canvas with Pan & Zoom (2-3h)
4. **PR #4:** Cursor Sync (3-4h)
5. **PR #5:** Presence Awareness (1-2h)
6. **PR #6:** Rectangle Creation (2-3h)
7. **PR #7:** Rectangle Sync (2-3h)
8. **PR #8:** Rectangle Movement & Selection (2-3h)
9. **PR #9:** State Persistence & Auto-Save (1-2h)
10. **PR #10:** Polish & Testing (2-3h)

## Contributing

This is a school project with a 24-hour timeline. The focus is on demonstrating multiplayer infrastructure rather than feature richness.

## License

Educational/School Project - Not for commercial use

