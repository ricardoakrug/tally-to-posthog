import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    console.log('Incoming request body:', req.body);

    const tallyData = req.body.data || {};
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

    // Send the event to PostHog
    const posthogResponse = await axios.post('https://us.i.posthog.com/capture/', {
      api_key: process.env.POSTHOG_API_KEY,  // Use your PostHog API key
      event: 'Survey Answered',
      distinct_id: email, // Use the email as the distinct_id
      properties: properties,
    });

    // Log the response from PostHog
    console.log('PostHog response:', posthogResponse.data);

    // Return success response
    return res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error('Error processing webhook or sending to PostHog:', error);
    return res.status(500).json({ error: 'Failed to process webhook or send to PostHog' });
  }
}
