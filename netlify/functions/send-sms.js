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

    // Read the information sent from app.js
    const { phone, message } = JSON.parse(event.body || "{}");

    // Check required information
    if (!phone || !message) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Phone number and message are required"
        })
      };
    }

    // ---------------------------------------------
    // Twilio environment variables
    // ---------------------------------------------

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Twilio environment variables are not configured."
        })
      };
    }

    // ---------------------------------------------
    // Send SMS through Twilio
    // ---------------------------------------------

    const twilioUrl =
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
          "Basic " +
          Buffer.from(`${accountSid}:${authToken}`).toString("base64")
      },
      body: new URLSearchParams({
        To: phone,
        From: twilioPhoneNumber,
        Body: message
      })
    });

    const twilioData = await twilioResponse.json();

    // ---------------------------------------------
    // Handle Twilio errors
    // ---------------------------------------------

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioData);

      return {
        statusCode: twilioResponse.status,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Twilio could not send the SMS.",
          details: twilioData
        })
      };
    }

    // ---------------------------------------------
    // Success
    // ---------------------------------------------

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        success: true,
        message: "SMS sent successfully through Twilio.",
        sid: twilioData.sid,
        status: twilioData.status,
        phone: phone
      })
    };

  } catch (error) {
    console.error("Unexpected error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Unexpected error while sending SMS.",
        details: error.message
      })
    };
  }
};
