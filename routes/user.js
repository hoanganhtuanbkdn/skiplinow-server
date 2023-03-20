const express = require('express')
const { createUser, validateAccessCode } = require('../controllers/user')
const router = express.Router()

router.post('/', async (req, res) => {
  const { phoneNumber } = req.body

  if (!phoneNumber) {
    return res.status(500).json('Phone number is required')
  }
  let newUser = {
    phoneNumber
  }

  const result = await createUser(newUser)

  if (result.success) {
    return res.status(200).json(result)
  }

  return res.status(400).json(result)
})
router.post('/verify', async (req, res) => {
  const { phoneNumber } = req.body

  if (!phoneNumber) {
    return res.status(400).json('Phone number is required')
  }

  const result = await validateAccessCode(req.body)

  if (result.success) {
    return res.status(200).json(result)
  }
  return res.status(400).json(result)
})

module.exports = router
