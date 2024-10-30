const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      const response = await axios.post('https://us.i.posthog.com/capture/', {
        api_key: process.env.POSTHOG_API_KEY,
        event: req.body.event,
        distinct_id: req.body.distinct_id,
        properties: req.body.properties,
      });
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send to PostHog', details: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
