const form = document.getElementById("subscribe-form");
const emailInput = document.getElementById("email");
const button = document.getElementById("subscribe-button");
const note = document.getElementById("subscribe-note");
const errorMessage = document.getElementById("subscribe-error");
const successMessage = document.getElementById("subscribe-success");

const endpoint = "/.netlify/functions/subscribe";

const showError = (message) => {
  errorMessage.textContent = message;
};

const clearMessages = () => {
  showError("");
  successMessage.classList.remove("show");
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessages();

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const payload = {
    email: emailInput.value.trim(),
    company: String(formData.get("company") ?? "").trim(),
  };

  button.disabled = true;
  form.classList.add("is-submitting");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong. Please try again.");
    }

    form.reset();
    form.style.display = "none";
    note.style.display = "none";
    successMessage.classList.add("show");
  } catch (error) {
    showError(error.message || "Unable to submit right now.");
  } finally {
    button.disabled = false;
    form.classList.remove("is-submitting");
  }
});
