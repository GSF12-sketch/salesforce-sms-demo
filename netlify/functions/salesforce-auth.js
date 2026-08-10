
exports.handler = async function () {
  try {
    const clientId = process.env.SF_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET;
    const loginUrl = process.env.SF_LOGIN_URL || "https://login.salesforce.com";

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Salesforce environment variables are not configured."
        })
      };
    }

    const tokenUrl = `${loginUrl}/services/oauth2/token`;

    const response = await fetch(tokenUrl, {
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

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Salesforce authentication failed",
          details: data
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Successfully authenticated with Salesforce."
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unexpected error",
        details: error.message
      })
    };
  }
};
