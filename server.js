
const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const OLLAMA_URL = "http://127.0.0.1:11434";
const MODEL = "gemma4:e2b";

// Keep uploaded images in memory and limit their size to 5 MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error("Please upload a JPG, PNG, or WEBP image.")
      );
    }

    callback(null, true);
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      throw new Error("Ollama did not respond successfully.");
    }

    const data = await response.json();
    const models = data.models || [];
    const modelAvailable = models.some(
      (item) => item.name === MODEL
    );

    res.json({
      ok: true,
      ollamaConnected: true,
      model: MODEL,
      modelAvailable,
      message: modelAvailable
        ? "HauntWise AI is ready to use Gemma 4."
        : "Ollama is running, but the configured model was not found."
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      message: "Cannot connect to Ollama. Make sure Ollama is running.",
      details: error.message
    });
  }
});

app.post("/api/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "Please upload an image of your materials."
    });
  }

  const userPreferences =
    (req.body.preferences || "").trim();

 
const prompt = `
You are HauntWise AI, a creative and practical Halloween costume designer.

Your mission is to help users create a costume they can realistically make using materials they already own.

USER PREFERENCES:
${userPreferences || "No preferences supplied."}

EXAMINE THE PHOTO:
- Identify only materials and objects you can reasonably see.
- Clearly mention uncertainty about unclear objects.
- Never claim a material is present when you cannot see it.

BE PRACTICAL:
- Respect the user's preferred character or style where possible.
- If the materials are insufficient for an exact character costume, explain what is missing and offer an easier inspired-by version.
- Suggest realistic alternatives using available materials.
- Estimate preparation time and additional cost in Indian rupees (₹).
- Clearly label cost as an estimate, not a verified price.
- Prefer reuse and low-cost options.
- Avoid open flames, dangerous electrical work, exposed sharp edges, blocked vision, and restricted movement.

Return the result in this format:

## Your Best Match

### [Costume name]

**The concept:** Describe the costume in two engaging sentences.

**Materials visible:** List only materials visible in the photo.

**Extra materials:** List additional items genuinely needed.

**Estimated time:** Give a realistic time range.

**Estimated extra cost:** Give a rough ₹ range and explain assumptions.

**Difficulty:** Beginner, Intermediate, or Advanced.

### Build It Step by Step
Provide clear, numbered, actionable construction steps.

### Safety Check
Provide a short checklist of relevant risks and safer alternatives.

## Two More Ideas
Suggest exactly two genuinely different alternatives.
For each, give the name, concept, visible materials used,
additional materials needed, and why someone might choose it.
One alternative must be especially easy to make.

## Your Next Move
End with one short, encouraging action the user can start immediately.

Use clear headings, bold labels, and numbered lists.
Return Markdown, not HTML or JSON.
`.trim();


try {
  const imageBase64 = req.file.buffer.toString("base64");

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: `${prompt}

Provide a complete, concise answer.
Finish every section and sentence.
Include one best costume and two alternatives.
Keep the construction steps practical.`,
      images: [imageBase64],
      stream: false,
      options: {
        num_ctx: 4096,
        num_predict: 1000,
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const answer = (data.response || "").trim();

  console.log("Gemma response diagnostics:", {
    answerLength: answer.length,
    done: data.done,
    doneReason: data.done_reason,
    evaluatedTokens: data.eval_count
  });

  if (!answer) {
    throw new Error(
      `Ollama returned no text. Finish reason: ${data.done_reason || "unknown"}. Check the terminal diagnostics.`
    );
  }

  return res.json({ answer });

  } catch (error) {
    console.error("Analysis failed:", error.message);

    res.status(502).json({
      error: "Gemma analysis failed. Check Ollama and try again.",
      details: error.message
    });
  }
});


app.post("/api/safety-plan", async (req, res) => {
  const {
    ageGroup,
    language,
    companion,
    outing,
    timeOfDay,
    notes
  } = req.body || {};

  const languages = {
    en: "English",
    kn: "Kannada",
    hi: "Hindi"
  };

  if (!languages[language]) {
    return res.status(400).json({
      error: "Please choose English, Kannada, or Hindi."
    });
  }

  const clean = (value, max = 200) =>
    typeof value === "string"
      ? value.trim().slice(0, max)
      : "";

  const prompt = `
You are HauntWise AI, a family Halloween safety assistant.

Create a practical Trick-or-Treat safety plan in ${languages[language]}.

Age group: ${clean(ageGroup, 40) || "Not specified"}
Companion: ${clean(companion, 60) || "Not specified"}
Activity: ${clean(outing, 60) || "Trick-or-treating"}
Time: ${clean(timeOfDay, 40) || "Not specified"}
Additional needs: ${clean(notes, 200) || "None provided"}

Organise the plan into:
1. Before leaving
2. During the outing
3. When returning home

Keep the response concise but complete.
Finish every sentence and every numbered instruction.
Do not stop halfway through a section.
Provide no more than 3 costume ideas.
Use short, practical instructions.

Do not claim a route is verified safe or invent local rules
or emergency numbers. Use age-appropriate language.
`.trim();

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      stream: false,
      think: false,
      options: {
       num_ctx: 2048,
       num_predict: 500,
       temperature: 0.4
}
      })
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    const answer = data.message?.content;

    console.log("Costume prompt:", prompt);
    console.log("Gemma's answer:", answer);

    if (!answer) {
      throw new Error("Gemma returned an empty safety plan.");
    }

    res.json({ answer });
  } catch (error) {
    console.error("Safety plan failed:", error.message);

    res.status(502).json({
      error: "Gamma could not generate a safety plan. Check Ollama and try again."
    });
  }
});


// Return useful, readable errors for invalid uploads.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: "The image could not be uploaded. Maximum size is 5 MB."
    });
  }

  if (error.message?.startsWith("Please upload")) {
    return res.status(400).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`HauntWise AI running at http://localhost:${PORT}`);
  console.log(`Using Ollama model: ${MODEL}`);
});
