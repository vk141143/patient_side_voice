# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)


---

## 🎙️ Hybrid Voice Assistant

### Architecture

```
User Voice
   ↓
Web Speech API (Device Microphone)
   ↓
Transcript (5 languages: en/hi/te/ta/kn)
   ↓
📖 Multilingual Symptom Dictionary (300+ keywords)
   ├─→ ✅ Symptoms Found → Display Result (source: 'dictionary')
   │                       ⚡ <10ms latency
   │                       💰 $0 cost
   └─→ ❌ No Match
        ↓
   🔒 Supabase Edge Function (analyze-symptoms)
        ↓
   ✨ Gemini 1.5 Flash API (server-side only)
        ↓
   📊 { symptoms, doctor, confidence }
        ↓
   Display Result (source: 'gemini')
   ⏱️ 2-3s latency
   💰 $0.00001/request
        ↓
   🔊 Device Native TTS (Android/iOS voices)
```

### Features

- ✅ **5 Languages:** English, Hindi, Telugu, Tamil, Kannada
- ✅ **15 Symptoms:** Fever, Headache, Cough, Cold, Weakness, Body Pain, Vomiting, Stomach Pain, Dizziness, Fatigue, Nausea, Diarrhea, Sore Throat, Chills, Dehydration
- ✅ **Hybrid Detection:** Dictionary (fast) → Gemini (fallback)
- ✅ **Zero Frontend Secrets:** Gemini API key stored only in Supabase
- ✅ **Device TTS:** Native Android/iOS voices
- ✅ **Future-Ready:** Specialist routing structure (Dermatologist, Pediatrician, etc.)

### Quick Start

See [QUICK_START.md](./QUICK_START.md) for deployment commands.

### Documentation

- [QUICK_START.md](./QUICK_START.md) — Deploy in 3 commands
- [VOICE_ASSISTANT_DEPLOYMENT.md](./VOICE_ASSISTANT_DEPLOYMENT.md) — Complete guide
- [VOICE_ASSISTANT_SUMMARY.md](./VOICE_ASSISTANT_SUMMARY.md) — Implementation overview

### Security

🔐 **CRITICAL:** Gemini API key is stored ONLY in Supabase Secrets (server-side). Frontend never sees it.

```bash
# Set secret (one-time)
npx supabase secrets set GEMINI_API_KEY=YOUR_KEY

# Deploy edge function
npx supabase functions deploy analyze-symptoms
```

### Cost

- **Dictionary Path:** $0 (80% of requests)
- **Gemini Path:** $0.00001/request (20% of requests)
- **Total:** ~$0.02/month for 10,000 users

### Files

```
src/
├── data/symptomDictionary.ts         # 300+ multilingual keywords
├── utils/symptomDetector.ts          # Detection engine
└── components/screens/
    └── VoiceAssistantModal.tsx       # Hybrid UI

supabase/functions/
└── analyze-symptoms/
    └── index.ts                      # Gemini integration (server-side)
```
