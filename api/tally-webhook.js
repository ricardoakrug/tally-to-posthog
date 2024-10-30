const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

app.post('/api/tally-webhook', async (req, res) => {
  try {
    // Extract the fields from the incoming Tally webhook
    const tallyData = req.body.data;
    const emailField = tallyData.fields.find(field => field.label === 'email');
    const email = emailField ? emailField.value : 'unknown';

    // Create properties object from the Tally fields
    const properties = {};
    tallyData.fields.forEach(field => {
      if (field.type === 'MULTIPLE_CHOICE' && field.value.length > 0) {
        const selectedOption = field.options.find(option => option.id === field.value[0]);
        properties[field.label] = selectedOption ? selectedOption.text : 'Unknown';
      } else {
        properties[field.label] = field.value;
      }
    });

    // Send the data to PostHog
    await axios.post('https://us.i.posthog.com/capture/', {
      api_key: process.env.POSTHOG_API_KEY,
      event: 'Survey Answered',
      distinct_id: email,
      properties: properties,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

module.exports = app;
