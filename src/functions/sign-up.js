const axios = require('axios').default

const https = require('https')

exports.handler = async (event, context) => {
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

  axios
    .post('https://api.buttondown.email/v1/subscribers', msg, {
      headers: headers,
    })
    .then(function (response) {
      statusCode = response.status
      console.log(response)
    })
    .catch(function (error) {
      statusCode = error.status
      console.log(error)
    })

  return {
    statusCode: 200,
    body: `You're signed up ${event.queryStringParameters.email} ${statusCode} ${data} `,
  }
}
