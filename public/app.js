const form = document.querySelector("#costumeForm");
const imageInput = document.querySelector("#imageInput");
const preview = document.querySelector("#imagePreview");
const previewContainer = document.querySelector("#previewContainer");
const removeImage = document.querySelector("#removeImage");

const emptyState = document.querySelector("#emptyState");
const loadingState = document.querySelector("#loadingState");
const errorMessage = document.querySelector("#errorMessage");
const result = document.querySelector("#result");
const resultText = document.querySelector("#resultText");
const generateButton = document.querySelector("#generateButton");

let previewUrl = null;

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.hidden = true;
  errorMessage.textContent = "";
}

imageInput.addEventListener("change", () => {
  clearError();
  const file = imageInput.files[0];
  if (!file) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    imageInput.value = "";
    showError("Please choose a JPG, PNG, or WEBP image.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    imageInput.value = "";
    showError("Your image must be smaller than 5 MB.");
    return;
  }

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  previewContainer.hidden = false;
});

removeImage.addEventListener("click", () => {
  imageInput.value = "";
  preview.removeAttribute("src");
  previewContainer.hidden = true;

  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  clearError();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const file = imageInput.files[0];
  if (!file) {
    showError("Please upload a photo of your materials first.");
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append(
    "preferences",
    document.querySelector("#preferences").value.trim()
  );

  generateButton.disabled = true;
  generateButton.textContent = "Creating your costume...";
  emptyState.hidden = true;
  result.hidden = true;
  loadingState.hidden = false;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
  throw new Error(
    [data.error, data.details].filter(Boolean).join(" — ") ||
    `HTTP ${response.status}`
  );
}

    renderCostumePlan(data.answer);
    result.hidden = false;
  } catch (error) {
    showError(error.message + " Check that Ollama is running and try again.");
    emptyState.hidden = false;
  } finally {
    loadingState.hidden = true;
    generateButton.disabled = false;
    generateButton.textContent = "✦ Create My Costume";
  }
});


/* Trick-or-Treat Safety Planner */

const safetyForm = document.querySelector("#safetyForm");
const safetyLoading = document.querySelector("#safetyLoading");
const safetyError = document.querySelector("#safetyError");
const safetyResult = document.querySelector("#safetyResult");
const safetyResultText = document.querySelector("#safetyResultText");
const safetyGenerateButton = document.querySelector("#safetyGenerateButton");

safetyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  safetyError.hidden = true;
  safetyError.textContent = "";
  safetyResult.hidden = true;
  safetyLoading.hidden = false;
  safetyGenerateButton.disabled = true;
  safetyGenerateButton.textContent = "Preparing your plan...";

  const plan = {
    ageGroup: document.querySelector("#ageGroup").value,
    language: document.querySelector("#language").value,
    companion: document.querySelector("#companion").value,
    outing: document.querySelector("#outing").value,
    timeOfDay: document.querySelector("#timeOfDay").value,
    notes: document.querySelector("#notes").value.trim()
  };

  try {
    const response = await fetch("/api/safety-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(plan)
    });

    const responseText = await response.text();

let data;

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(
    `Server response was not JSON (HTTP ${response.status}): ` +
    responseText.slice(0, 200)
  );
}

    if (!response.ok) {
  const details = data.details
    ? ` Details: ${data.details}`
    : "";

  throw new Error(
    (data.error || "AI analysis failed.") + details
  );
}

    safetyResultText.textContent = data.answer;
    safetyResult.hidden = false;

  } catch (error) {
    safetyError.textContent =
      error.message + " Please check that the server and Ollama are running.";
    safetyError.hidden = false;

  } finally {
    safetyLoading.hidden = true;
    safetyGenerateButton.disabled = false;
    safetyGenerateButton.textContent = "✦ Create My Safety Plan";
  }
});


function renderCostumePlan(markdown) {
  const root = document.querySelector("#resultText");
  root.replaceChildren();
  root.className = "result-text costume-plan";

  const lines = String(markdown || "")
    .replace(/\r/g, "")
    .split("\n");

  let section = null;
  let list = null;

  function addText(parent, text) {
    const parts = text.split(/(\*\*.*?\*\*)/g);

    for (const part of parts) {
      if (part.startsWith("**") && part.endsWith("**")) {
        const strong = document.createElement("strong");
        strong.textContent = part.slice(2, -2);
        parent.appendChild(strong);
      } else if (part) {
        parent.appendChild(document.createTextNode(part));
      }
    }
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const heading = line.match(/^#{1,3}\s+(.+)$/);

    if (heading) {
      section = document.createElement("section");
      section.className = "plan-section";

      const title = document.createElement(
        line.startsWith("## ") ? "h2" : "h3"
      );

      addText(title, heading[1]);
      section.appendChild(title);
      root.appendChild(section);
      list = null;
      continue;
    }

    if (!section) {
      section = document.createElement("section");
      section.className = "plan-section";
      root.appendChild(section);
    }

    const item = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);

    if (item) {
      if (!list) {
        list = document.createElement(
          /^\d/.test(line) ? "ol" : "ul"
        );
        list.className = "plan-list";
        section.appendChild(list);
      }

      const li = document.createElement("li");
      addText(li, item[1]);
      list.appendChild(li);
    } else {
      list = null;
      const paragraph = document.createElement("p");
      addText(paragraph, line);
      section.appendChild(paragraph);
    }
  }
}

