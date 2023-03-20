const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

var serviceAccount = require('./service.json') // Or your config object as above.

const app = initializeApp({
  credential: cert(serviceAccount), // Or credential
  databaseURL: 'https://skiplinow-d07eb.firebaseio.com'
})

const db = getFirestore(app)

const FirebaseService = {
  db
}
module.exports = FirebaseService
