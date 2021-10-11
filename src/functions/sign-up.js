const https = require('https')

exports.handler = async (event, context) => {
  const msg = JSON.stringify({
    email: 'ben.hyrman+test1@gmail.com',
    referrer_url: 'hyr.mn',
    metadata: {},
    tags: ['hyr.mn'],
  })

  const options = {
    hostname: 'api.buttondown.email',
    port: 443,
    path: '/v1/subscribers',
    method: 'POST',
    headers: {
      Authorization: 'token ' + process.env['BUTTONDOWN_TOKEN'],
      'Content-Type': 'application/json',
      'Content-Length': msg.length,
    },
  }

  let data = ''
  let statusCode = 0

  const request = https
    .request(options, (res) => {
      statusCode = res.statusCode
      res.on('data', (chunk) => {
        data += chunk.toString()
      })
    })
    .on('error', (e) => {
      data = 'error'
    })

  request.write(msg)
  request.end()

  if (statusCode == 500) {
    return {
      statusCode: 500,
      body: "We weren't able to sign you up",
    }
  }

  return {
    statusCode: 200,
    body: "You're signed up",
  }
}
