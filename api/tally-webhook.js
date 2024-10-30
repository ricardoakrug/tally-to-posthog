const axios = require('axios');

module.exports = async function handler(req, res) {
  // Ensure only POST requests are allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    console.log('Incoming request body:', req.body);

    const tallyData = req.body.data || {};

    // Check if 'fields' property exists in the incoming data
    if (!tallyData.fields) {
      console.error('Missing fields in request body:', tallyData);
      return res.status(400).json({ error: 'Missing fields in request body' });
    }

    // Extract the email field
    const emailField = tallyData.fields.find(field => field.label === 'email');
    const email = emailField ? emailField.value : 'unknown';

    // Prepare properties from the Tally data fields
    const properties = {};
    tallyData.fields.forEach(field => {
      if (field.type === 'MULTIPLE_CHOICE' && field.value.length > 0) {
        const selectedOption = field.options.find(option => option.id === field.value[0]);
        properties[field.label] = selectedOption ? selectedOption.text : 'Unknown';
      } else {
        properties[field.label] = field.value;
      }
    });

    console.log('Final processed data:', { email, properties });

    // Send the event to PostHog using Axios
    try {
      const response = await axios.post(
        'https://app.posthog.com/capture/',
        {
          distinct_id: email,
          event: 'Survey Answered',
          properties: properties
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${process.env.POSTHOG_API_KEY}' // Include the API key in the headers
          }
        }
      );

      console.log('Response from PostHog:', response.data);
      return res.status(200).json({ success: true, data: properties });
    } catch (error) {
      console.error('Error sending to PostHog:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Failed to send event to PostHog' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error.message);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
};
