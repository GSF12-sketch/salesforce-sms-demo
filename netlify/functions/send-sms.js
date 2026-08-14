exports.handler = async function (event) {
  try {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // Read the information sent from your website
    const { phone, message } = JSON.parse(event.body);

    // Check that required information was provided
    if (!phone || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Phone number and message are required"
        })
      };
    }

    // For now, just confirm that Netlify received the request.
    // We will connect this to Salesforce in the next step.
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Netlify Function received the SMS request",
        phone: phone,
        smsMessage: message
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Something went wrong",
        details: error.message
      })
    };
  }
};
