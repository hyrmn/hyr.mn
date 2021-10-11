const axios = require('axios').default

exports.handler = async (event) => {
  console.log('started invoke')

  const msg = JSON.stringify({
    email: event.queryStringParameters.email,
    referrer_url: 'hyr.mn',
    metadata: {},
    tags: ['hyr.mn'],
  })

  const headers = {
    Authorization: 'token ' + process.env['BUTTONDOWN_TOKEN'],
    'Content-Type': 'application/json',
    'Content-Length': msg.length,
  }

  let data = ''
  var statusCode = 0

  console.log('sending POST')
  try {
    const result = await axios.post(
      'https://api.buttondown.email/v1/subscribers',
      msg,
      { headers: headers },
    )

    console.log(result.status)
    return {
      statusCode: 200,
      body: `You're signed up!`,
    }
  } catch (err) {
    console.log(err)
    return {
      statusCode: 400,
      body: "We weren't able to sign you up",
    }
  }
}
