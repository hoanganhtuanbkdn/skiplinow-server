const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const app = express()
const cors = require('cors')

const {
  getUserProfile,
  likeGithubUser,
  searchGithubUsers
} = require('./controllers/user')

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)
app.use(bodyParser.json())

app.use(cors())

app.use('/user', require('./routes/user'))

app.get('/searchGithubUsers', async (req, res) => {
  const result = await searchGithubUsers(req.query)

  if (result.success) {
    return res.status(200).json(result)
  }
  return res.status(500).json(result)
})

app.get('/findGithubUserProfile/:githubUserId', async (req, res) => {
  const { githubUserId } = req.params

  if (!githubUserId) {
    res.status(400).send('Missing parameters')
    return
  }

  const result = await findGithubUserProfile(req.params)
  if (result.success) {
    return res.status(200).json(result)
  }
  return res.status(500).json(result)
})

app.post('/likeGithubUser', async (req, res) => {
  const { phoneNumber, githubUserId } = req.body

  if (!phoneNumber || !githubUserId) {
    res.status(400).send('Missing parameters')
    return
  }

  try {
    const result = await likeGithubUser(req.body)

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message })
  }
})

app.get('/getUserProfile/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params

  if (!phoneNumber) {
    res.status(400).send('Missing parameters')
    return
  }

  const result = await getUserProfile(req.params)

  if (result.success) {
    return res.status(200).json(result)
  }

  return res.status(500).json(result)
})

app.listen(5000, () => {
  console.log('Server running on port 5000')
})
