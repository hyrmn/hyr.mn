// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
const handler = async (event) => {
  try {
    const subject = event.queryStringParameters.name || 'World'
    const thing = process.env.SAMPLE_SECRET

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Hello ${subject} - ${thing}` }),
    }
  } catch (error) {
    return { statusCode: 500, body: error.toString() }
  }
}

module.exports = { handler }