const axios = require('axios').default

const https = require('https')

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
  axios
    .post('https://api.buttondown.email/v1/subscribers', msg, {
      headers: headers,
    })
    .then(function (response) {
      console.log(`success - status: ${response.status}`)
      statusCode = response.status
      console.log(response)
    })
    .catch(function (error) {
      console.log(`err - status: ${error.status}`)

      statusCode = error.status
      console.log(error)
    })

  return {
    statusCode: 200,
    body: `You're signed up ${event.queryStringParameters.email} ${statusCode} ${data} `,
  }
}
