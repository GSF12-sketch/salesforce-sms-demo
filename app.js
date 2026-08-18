document
  .getElementById("searchButton")
  .addEventListener("click", async function () {

    const searchBox = document.getElementById("searchBox");
    const results = document.getElementById("results");
    const searchButton = document.getElementById("searchButton");
    const smsSection = document.getElementById("smsSection");

    const searchTerm = searchBox.value.trim();

    // Hide SMS section when performing a new search
    smsSection.style.display = "none";

    // Make sure the user entered something
    if (!searchTerm) {
      results.innerHTML = "<p>Please enter a Contact name.</p>";
      return;
    }

    // Show searching message
    results.innerHTML = "<p>Searching Salesforce...</p>";
    searchButton.disabled = true;

    try {

      const response = await fetch(
        "/.netlify/functions/search-contacts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            searchTerm: searchTerm
          })
        }
      );

      const data = await response.json();

      // Re-enable Search button
      searchButton.disabled = false;

      // If Netlify/Salesforce returned an error
      if (!response.ok) {
        results.innerHTML = `
          <p>
            <strong>Error:</strong>
            ${data.error || "Something went wrong."}
          </p>
        `;

        console.error("Search error:", data);
        return;
      }

      // No contacts found
      if (!data.contacts || data.contacts.length === 0) {
        results.innerHTML = `
          <p>No Contacts found for "${searchTerm}".</p>
        `;
        return;
      }

      // Display Contacts
      let html = `<h3>Search Results</h3>`;

      data.contacts.forEach(function (contact, index) {

        const fullName =
          `${contact.FirstName || ""} ${contact.LastName || ""}`.trim();

        html += `
          <div class="contact-result">

            <p>
              <strong>${fullName}</strong>
            </p>

            <p>
              Email: ${contact.Email || "No email"}
            </p>

            <p>
              Mobile: ${contact.MobilePhone || "No mobile number"}
            </p>

            <button
              class="select-contact-button"
              data-index="${index}">
              Select Contact
            </button>

          </div>

          <hr>
        `;
      });

      results.innerHTML = html;

      // ---------------------------------------------
      // Select Contact
      // ---------------------------------------------

      document
        .querySelectorAll(".select-contact-button")
        .forEach(function (button) {

          button.addEventListener("click", function () {

            const index = this.getAttribute("data-index");
            const contact = data.contacts[index];

            const mobileNumber = contact.MobilePhone || "";

            // Make selected mobile number available
            document.getElementById("selectedMobile").textContent =
              mobileNumber || "No mobile number available";

            // Clear previous message/status
            document.getElementById("messageBox").value = "";
            document.getElementById("smsStatus").textContent = "";

            // Show SMS section
            smsSection.style.display = "block";

            // Store selected contact information
            smsSection.dataset.contactId = contact.Id || "";
            smsSection.dataset.mobilePhone = mobileNumber;

            // Scroll to SMS section
            smsSection.scrollIntoView({
              behavior: "smooth"
            });
          });
        });

    } catch (error) {

      searchButton.disabled = false;

      results.innerHTML = `
        <p>
          <strong>Error:</strong>
          Unable to connect to the search service.
        </p>
      `;

      console.error("Connection error:", error);
    }

  });


// =====================================================
// SEND SMS
// =====================================================

document
  .getElementById("sendSmsButton")
  .addEventListener("click", async function () {

    const smsSection = document.getElementById("smsSection");
    const messageBox = document.getElementById("messageBox");
    const sendSmsButton = document.getElementById("sendSmsButton");
    const smsStatus = document.getElementById("smsStatus");

    const mobilePhone = smsSection.dataset.mobilePhone;
    const contactId = smsSection.dataset.contactId;
    const message = messageBox.value.trim();

    // ---------------------------------------------
    // Validate mobile number
    // ---------------------------------------------

    if (!mobilePhone) {
      smsStatus.innerHTML =
        "<strong>Error:</strong> This contact does not have a MobilePhone number.";

      return;
    }

    // ---------------------------------------------
    // Validate message
    // ---------------------------------------------

    if (!message) {
      smsStatus.innerHTML =
        "<strong>Error:</strong> Please enter a message.";

      return;
    }

    // ---------------------------------------------
    // Disable button while sending
    // ---------------------------------------------

    sendSmsButton.disabled = true;
    smsStatus.textContent = "Sending SMS...";

    try {

      const response = await fetch(
        "/.netlify/functions/send-sms",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phone: mobilePhone,
            message: message,
            contactId: contactId
          })
        }
      );

      const data = await response.json();

      // ---------------------------------------------
      // Handle SMS response
      // ---------------------------------------------

      if (!response.ok) {

        smsStatus.innerHTML = `
          <strong>Error:</strong>
          ${data.error || "SMS could not be sent."}
        `;

        console.error("SMS error:", data);
        return;
      }

      smsStatus.innerHTML =
        "<strong>SMS sent successfully!</strong>";

      // Clear message after successful send
      messageBox.value = "";

      console.log("SMS response:", data);

    } catch (error) {

      smsStatus.innerHTML = `
        <strong>Error:</strong>
        Unable to connect to the SMS service.
      `;

      console.error("SMS connection error:", error);

    } finally {

      sendSmsButton.disabled = false;

    }

  });
