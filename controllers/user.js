var { db } = require('../services/firebase')
var { generateID } = require('../utils')
const AWS = require('aws-sdk')
const moment = require('moment')
const axios = require('axios')

const sns = new AWS.SNS({
  accessKeyId: 'AKIA2MWXIYNMELRPBSBZ',
  secretAccessKey: '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',
  region: 'ap-southeast-1'
})

const accountSid = 'AC5be524c9642d336a6332435a7708a4d6'
const authToken = 'f717a93eddc0df992a3073cf97fc275b'
const GIT_TOKEN = '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'

const client = require('twilio')(accountSid, authToken)

const createNewAccessCode = (length) => {
  const newCode = generateID(length)
  return newCode
}

const searchGithubUsers = async ({ query, page = 0, per_page = 10 }) => {
  try {
    const response = await axios.get('https://api.github.com/search/users', {
      params: {
        q: query,
        page: page,
        per_page: per_page
      },
      headers: {
        Authorization: `Bearer ${GIT_TOKEN}`
      }
    })

    const users = response.data.items.map((item) => ({
      login: item.login,
      id: item.id,
      avatar_url: item.avatar_url,
      html_url: item.html_url
    }))

    return {
      success: true,
      data: {
        count: response.data.total_count,
        users
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

const findGithubUserProfile = async (data) => {
  try {
    const response = await axios.get(
      'https://api.github.com/user/' + data.githubUserId,
      {
        headers: {
          Authorization: `Bearer ${GIT_TOKEN}`
        }
      }
    )

    const data = response.data
    return {
      success: true,
      data: {
        login: data.login,
        id: data.id,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        public_repos: data.public_repos,
        followers: data.followers
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

const likeGithubUser = async ({ phoneNumber, githubUserId }) => {
  const res = await db
    .collection('favorite_github_users')
    .doc(githubUserId + '-' + phoneNumber)
    .set({
      phoneNumber,
      githubUserId,
      createdAt: moment().utc().toISOString()
    })

  return {
    success: true
  }
}
const createUser = async (data) => {
  const userRef = await db.collection('users').doc(data.phoneNumber)

  const doc = await userRef.get()

  if (doc.exists) {
    return {
      success: false,
      message: 'The account is exist already'
    }
  }

  const accessCode = createNewAccessCode(6)

  const res = await db
    .collection('users')
    .doc(data.phoneNumber)
    .set({
      ...data,
      accessCode,
      verify: false,
      createdAt: moment().utc().toISOString()
    })

  const params = {
    Message: 'Your verification code is: ' + accessCode,
    // Subject: 'Test Subject',
    // TopicArn: 'arn:aws:sns:us-west-2:123456789012:my-topic',
    // MessageStructure: 'Code',
    PhoneNumber: '+' + data.phoneNumber
  }

  sns.publish(params, function (err, data) {
    if (err) {
      console.log('Error sending message: ', err)
    } else {
      console.log('Message sent: ', data.MessageId)
    }
  })

  client.messages
    .create({
      body: 'Your verification code is: ' + accessCode,
      // from: '+15075007554',
      messagingServiceSid: 'MGc4dfa3879b0f67b52bded7344e02db60',

      to: '+' + data.phoneNumber
    })
    .then((message) => console.log(message.sid))
    .catch((e) => console.log('e', e))
  // send sms code
  return {
    success: true,
    data: {
      accessCode: accessCode,
      ...res
    }
  }
}

const validateAccessCode = async (data) => {
  const userRef = await db.collection('users').doc(data.phoneNumber)

  const doc = await userRef.get()

  if (!doc.exists) {
    return {
      success: false,
      message: 'The phone number is not found'
    }
  }

  const targetUser = doc.data()

  if (targetUser.verify) {
    return {
      success: true
    }
  }

  if (targetUser.accessCode === data.accessCode) {
    await userRef.update({
      verify: true,
      verifiedAt: moment().utc().toISOString(),
      accessCode: ''
    })
    const docUpdated = await userRef.get()
    const userUpdated = docUpdated.data()

    return {
      success: true,
      message: 'Your account has been verified',
      data: userUpdated
    }
  }

  return {
    success: false,
    message: "'The access code is invalid'"
  }
}
const getUserProfile = async (data) => {
  try {
    const userRef = await db.collection('users').doc(data.phoneNumber)

    const doc = await userRef.get()

    if (!doc.exists) {
      return {
        success: false,
        message: 'The phone number is not found'
      }
    }

    const profile = doc.data()

    const favoriteUsers = []

    const raw = await db
      .collection('favorite_github_users')
      .where('phoneNumber', '==', data.phoneNumber)
      .get()

    for (const doc of raw.docs) {
      favoriteUsers.push(doc.data())
    }

    const results = await Promise.all(
      favoriteUsers.map(async (favorite) => {
        const response = await axios.get(
          'https://api.github.com/user/' + favorite.githubUserId,
          {
            headers: {
              Authorization: `Bearer ${GIT_TOKEN}`
            }
          }
        )

        return response.data
      })
    )

    return {
      success: true,
      data: {
        profile,
        favoriteUsers: results
      }
    }
  } catch (e) {
    return {
      success: false,
      error: e.message
    }
  }
}
module.exports = {
  getUserProfile,
  validateAccessCode,
  createUser,
  searchGithubUsers,
  findGithubUserProfile,
  likeGithubUser
}
