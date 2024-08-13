var express = require('express');
var router = express.Router();
const Message = require('../models/messages')
const Alert = require('../models/alerts')
const User = require('../models/users')
const { isValidObjectId } = require('mongoose');
const { refreshGoogleToken, refreshPipedriveToken } = require('../modules/refreshTokens');
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');


const CLOUDINARY_URL = process.env.CLOUDINARY_URL


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


// Get Google reactions by message id 

router.get('/messages/reactions/:message_id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.message_id)) {
      return res.status(400).json({ result: false, error: 'Invalid Message Id' })
    }
    const messageData = await Message.findOne({ _id: req.params.message_id }).populate({ path: 'alert_id', populate: 'user_id' })

    if (!messageData) {
      return res.status(404).json({ result: false, error: 'Message not found' })
    }

    // Raffraichissement du Token Google si expiré

    let userData = messageData.alert_id.user_id
    const expirationDate = new Date(userData.google_tokens.expiration_date).getTime()
    if (Date.now() > expirationDate) {
      const tokens = await refreshGoogleToken(userData)
      if (!tokens.result) {
        // Si le refresh token ne fonctionne pas on renvoie la réponse de Google et un statut 401
        console.log('failed refresh token')
        return res.status(401).json(tokens)
      }
      // Puis on met à jour la variable user avec les nouvelles donéées 
      userData = await User.findOne({ _id: userData._id })
    }

    // Fetch des reactions Googles

    const reactionsResponse = await fetch(`https://chat.googleapis.com/v1/${messageData.google_response_details.name}/reactions`, {
      headers: { 'Authorization': `Bearer ${userData.google_tokens.access_token}` }
    })

    if (!reactionsResponse.ok) {
      return res.status(400).json({ result: false, error: 'Error while fetching Google reactions' })
    }

    const reactionsData = await reactionsResponse.json()



    // Calcul du total reaction et total par emoji

    if (!reactionsData.reactions) {
      return res.json({ result: true, message_id: messageData._id, reactions: 0, emojis: {} })
    }


    const totalReactionsCount = reactionsData.reactions.length
    let emojisCount = {}
    for (let element of reactionsData.reactions) {
      emojisCount[element.emoji.unicode] ? emojisCount[element.emoji.unicode]++ : emojisCount[element.emoji.unicode] = 1
    }



    res.json({ result: true, message_id: messageData._id, reactions: totalReactionsCount, emojis: emojisCount })

  } catch (err) {
    console.log(err)
    res.status(500).json({ result: false, error: 'Server Error' })
  }

})

router.post('/dashbord/send', async (req, res) => {

  console.log(req.body)

  const { pipedrive_company_id, pipedrive_user_id, google_channel_id, dashboard_name } = req.body
  let pictureUrl = ''

  try {

    let userData = await User.findOne({ pipedrive_company_id, pipedrive_user_id })

    // Recupération de l'image 

    const photoPath = `./tmp/${uniqid()}.jpg`
    const resultMove = await req.files.picture.mv(photoPath);

    // Upload cloudinary

    if (!resultMove) {

      const resultCloudinary = await cloudinary.uploader.upload(photoPath);
      fs.unlinkSync(photoPath)
      pictureUrl = resultCloudinary.secure_url

    } else {
      return res.status(500).json({ result: false, error: 'Error whilde uploading picture' })
    }

    // Refresh du token

    const expirationDate = new Date(userData.google_tokens.expiration_date).getTime()
    if (Date.now() > expirationDate) {
      const tokens = await refreshGoogleToken(userData)
      if (!tokens.result) {
        console.log('failed refresh token')
        return res.status(401).json(tokens)
      }
      userData = await User.findOne({ _id: userData._id })
    }

    // Fetch google pour envoyer le message

    const googleResponse = await fetch(`https://chat.googleapis.com/v1/spaces/${google_channel_id}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userData.google_tokens.access_token}` },
      body: JSON.stringify({
          text : `${dashboard_name} :${pictureUrl}`
                })
              })

    const googleData = await googleResponse.json()



    if (!googleResponse.ok) {
      return res.status(500).json({ result: false, error: 'Error while sending message', googleData })
    }

    res.json({ result: true, message : 'Dashboard Sent' })

  } catch (err) {

    console.log(err)
    res.status(500).json('Server Error')
  }

})


module.exports = router;
