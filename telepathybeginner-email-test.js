(() => {
  const form = document.querySelector("[data-email-test-form]");
  const status = document.querySelector("[data-email-test-status]");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form || !status) {
    return;
  }

  async function fileToBase64(file) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        const commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(new Error("Unable to read attachment file."));
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const formData = new FormData(form);
      const attachmentFile = formData.get("attachment");
      const payload = {
        action: "send_test_email",
        to: String(formData.get("to") || "").trim(),
        bcc: String(formData.get("bcc") || "").trim(),
        subject: String(formData.get("subject") || "").trim(),
        body: String(formData.get("body") || "")
      };

      if (!payload.to) {
        throw new Error("Please provide a To email address.");
      }

      if (attachmentFile instanceof File && attachmentFile.size > 0) {
        payload.attachment = {
          name: attachmentFile.name,
          type: attachmentFile.type || "application/octet-stream",
          content_base64: await fileToBase64(attachmentFile)
        };
      }

      status.textContent = "Sending test email...";

      const response = await fetch("api.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(String(data?.error || `Email send failed with status ${response.status}`));
      }

      status.textContent = "Test email sent successfully.";
    } catch (error) {
      status.textContent = error instanceof Error ? error.message : "Unable to send the test email right now.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
})();
