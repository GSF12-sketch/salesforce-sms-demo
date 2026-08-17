exports.handler = async function (event) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Method not allowed"
        })
      };
    }

    // Get the search term from app.js
    const body = JSON.parse(event.body || "{}");
    const searchTerm = (body.searchTerm || "").trim();

    if (!searchTerm) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Please enter a First Name."
        })
      };
    }

    // Salesforce environment variables
    const clientId = process.env.SF_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET;
    const loginUrl =
      process.env.SF_LOGIN_URL ||
      "https://login.salesforce.com";

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Salesforce environment variables are not configured."
        })
      };
    }

    // ---------------------------------------------
    // STEP 1: Authenticate with Salesforce
    // ---------------------------------------------

    const tokenUrl = `${loginUrl}/services/oauth2/token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return {
        statusCode: tokenResponse.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Salesforce authentication failed",
          details: tokenData
        })
      };
    }

    const accessToken = tokenData.access_token;
    const instanceUrl = tokenData.instance_url;

    if (!accessToken || !instanceUrl) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error:
            "Salesforce did not return an access token or instance URL."
        })
      };
    }

    // ---------------------------------------------
    // STEP 2: Search Contacts by FirstName
    // ---------------------------------------------

    // Escape apostrophes and backslashes
    const safeSearchTerm = searchTerm
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");

    const soql =
      `SELECT Id, FirstName, LastName, Email, MobilePhone ` +
      `FROM Contact ` +
      `WHERE FirstName LIKE '${safeSearchTerm}%' ` +
      `ORDER BY FirstName ` +
      `LIMIT 20`;

    const queryUrl =
      `${instanceUrl}/services/data/v67.0/query/?q=${encodeURIComponent(soql)}`;

    const queryResponse = await fetch(queryUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });

    const queryData = await queryResponse.json();

    // ---------------------------------------------
    // STEP 3: Handle Salesforce query errors
    // ---------------------------------------------

    if (!queryResponse.ok) {
      return {
        statusCode: queryResponse.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Salesforce Contact search failed",
          details: queryData
        })
      };
    }

    // ---------------------------------------------
    // STEP 4: Return Contacts
    // ---------------------------------------------

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        totalSize: queryData.totalSize,
        contacts: queryData.records
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Unexpected error",
        details: error.message
      })
    };
  }
};
