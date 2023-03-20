const generateID = (stringLength = 20) => {
  let randomStr = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  for (let index = 0; index < stringLength; index++) {
    randomStr += characters.charAt(
      Math.floor(Math.random() * characters.length)
    )
  }
  return randomStr
}

module.exports = {
  generateID
}
