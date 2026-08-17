document
  .getElementById("searchButton")
  .addEventListener("click", async function () {

    const searchBox = document.getElementById("searchBox");
    const results = document.getElementById("results");
    const searchButton = document.getElementById("searchButton");

    const searchTerm = searchBox.value.trim();

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

      data.contacts.forEach(function (contact) {

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
              Phone: ${contact.Phone || "No phone"}
            </p>
          </div>

          <hr>
        `;
      });

      results.innerHTML = html;

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
