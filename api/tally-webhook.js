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

    const emailField = tallyData.fields.find(field => field.label === 'email');
    const email = emailField ? emailField.value : 'unknown';

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
    try {
      await axios.post('https://app.posthog.com/capture/', {
        api_key: process.env.POSTHOG_API_KEY,  // Ensure this is set in Vercel's environment variables
        distinct_id: email,
        event: 'Survey Answered',
        properties: properties
      });

      console.log('Event sent to PostHog:', { email, properties });
    } catch (posthogError) {
      console.error('Error sending to PostHog:', posthogError.response?.data || posthogError.message);
      return res.status(500).json({ error: 'Failed to send event to PostHog' });
    }

    // Respond with success
    return res.status(200).json({ success: true, data: properties });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
}
