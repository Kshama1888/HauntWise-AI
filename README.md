# HauntWise-AI
A local-first AI assistant for organizing digital clutter using Ollama.
# 🎃 HauntWise AI
### Create. Check. Celebrate.

**HauntWise AI** is an AI-powered Halloween costume creation assistant that helps people turn everyday materials into creative, affordable costumes. Instead of buying a complete costume, users can upload a photo of items they already own and receive costume ideas, building instructions, material suggestions, and practical safety tips.

Built for the **Hacktoberfest Hack Day 2026 — Best Use of Gemma 4** track.

---

## 💡 The Problem

Creating a Halloween costume can be expensive, confusing, and wasteful. People may have clothes, cardboard, fabric, and craft supplies at home but lack ideas or instructions for turning them into a costume.

HauntWise AI aims to make costume creation more accessible, creative, and budget-friendly by helping users make better use of their existing materials.

## ✨ Key Features

- **Image-Based Material Understanding:** Upload a photo of your available materials for AI-assisted analysis.
- **Personalised Costume Ideas:** Describe your preferred character, theme, budget, or crafting difficulty.
- **Step-by-Step Instructions:** Receive a practical guide for building a costume.
- **Affordable Alternatives:** Get ideas that reuse available materials and identify items that may still be needed.
- **Safety Guidance:** Receive suggestions to help avoid blocked vision, restricted movement, exposed sharp edges, and other practical hazards.
- **Costume Build Checklist:** Use a preparation checklist to organise materials and track your progress.

> Some features and AI-generated recommendations are experimental. Always review the instructions and safety guidance before making or wearing a costume.

## 🧠 Why Gemma 4?

HauntWise AI uses **Gemma 4 through Ollama** for local AI inference.

Gemma 4 is used to:
- Interpret uploaded material photographs.
- Identify objects and materials that may be useful for a costume.
- Generate personalised costume concepts and instructions.
- Help turn a creative idea into a practical plan.

The AI can misidentify objects or suggest impractical instructions. Users should verify the identified materials and review the recommendations before acting on them.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML | Webpage structure |
| CSS | Visual design and responsive layout |
| JavaScript | Image preview, form handling, and results display |
| Node.js | JavaScript runtime |
| Express.js | Backend server and API routes |
| Multer | Handling image uploads |
| Gemma 4 | Image understanding and text generation |
| Ollama | Running and accessing the model locally |

## 🏗️ Project Structure

```text
HauntWise-AI/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

## ⚙️ Requirements

Before running the application, install:

- [Node.js](https://nodejs.org/)
- [Ollama](https://ollama.com/download)
- Git, for contributing
