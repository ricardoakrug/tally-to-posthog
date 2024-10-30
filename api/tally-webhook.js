export default async function handler(req, res) {
  // Ensure only POST requests are allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  try {
    // Log the incoming request body for debugging
    console.log('Incoming request body:', req.body);

    // Parse the incoming request body and check its structure
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

    // Log the final processed data for confirmation
    console.log('Final processed data:', { email, properties });
    
    // Respond with success
    return res.status(200).json({ success: true, data: properties });
  } catch (error) {
    // Catch and log any errors during processing
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Failed to process webhook' });
  }
}
