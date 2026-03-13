const https = require('https')
const fs = require('fs')

const req = https.request({
  hostname: 'api.groq.com',
  path: '/openai/v1/audio/transcriptions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
  }
}, (res) => {
  let data = ''
  res.on('data', d => data += d)
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data))
})

req.on('error', console.error)

const body = `------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="language"\r\n\r\nko\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="test.wav"\r\nContent-Type: audio/wav\r\n\r\nRIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--\r\n`

req.write(body)
req.end()
