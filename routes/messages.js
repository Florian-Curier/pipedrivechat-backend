var express = require('express');
var router = express.Router();
const Message = require('../models/messages')
const Alert = require('../models/alerts')
const User = require('../models/users')
const { isValidObjectId } = require('mongoose');
const { refreshGoogleToken, refreshPipedriveToken } = require('../modules/refreshTokens')
const { messagesDataByTimeUnit } = require('../modules/messagesDataByTimeUnit')
const { checkDatesMessages } = require('../modules/checkDatesMessages')

// Renvoie la liste de tous les messages de l'utilisateur
router.get('/all/:pipedrive_company_id/:pipedrive_user_id/:startDate/:endDate/:timeUnit', async (req, res) => {
    const {pipedrive_company_id, pipedrive_user_id, startDate, endDate, timeUnit} = req.params

    console.log(pipedrive_company_id)

    const user = await User.findOne({pipedrive_user_id, pipedrive_company_id})
    const alerts =  await Alert.find({user_id: user._id})
    
    let filterdate = checkDatesMessages(startDate, endDate)  
    
    let request = { alert_id :{$in : alerts} }
    if(filterdate){
        request = { alert_id :{$in : alerts}, creation_date: filterdate.creation_date }
    } 

    
    const messages= await Message.find(request)
    console.log("MASSAGES : ", messages.length)
        let result = messagesDataByTimeUnit(messages, timeUnit)  
        res.json({ messages: result })
    })

// Renvoie la liste de tous les messages de l'utilisateur correspondants à l'alert_id envoyé
router.get('/alert/:alert_id', (req, res) => {
    if (!isValidObjectId(req.params.alert_id)) {
        return res.status(400).json({ result: false, error: 'Invalid ObjectId' })
    }
    Message.find({ alert_id: req.params.alert_id }).sort({creation_date:-1}) 
    .then(data => {
        res.json({ messages: data })
    })
})

// Renvoie la liste de tous les messages de l'utilisateur correspondants à l'alert_id envoyé pour le graphique
router.get('/alert/:alert_id/:startDate/:endDate/:timeUnit', (req, res) => {
    const { alert_id, startDate, endDate, timeUnit } = req.params
    
    let filterdate = checkDatesMessages(startDate, endDate)   
    console.log(filterdate)
    let request = { alert_id }
    if(filterdate){
        request = { alert_id, creation_date: filterdate.creation_date }
    } 
    console.log(request)
    if (!isValidObjectId(alert_id)) {
        return res.status(400).json({ result: false, error: 'Invalid ObjectId' })
    }
    Message.find(request).then(data => {
        
        let result = messagesDataByTimeUnit(data, timeUnit)
        res.json({ result: true, messages: result })
    })
})

// Renvoie la liste de tous les messages de l'utilisateur correspondants à l'channel_id envoyé
router.get('/channel/:google_channel_id/:startDate/:endDate/:timeUnit', async (req, res) => {
    const { google_channel_id, startDate, endDate, timeUnit } = req.params

    let filterdate = checkDatesMessages(startDate, endDate)  

    let channelName = `spaces/${google_channel_id}`
    
    let request = { 'google_response_details.space.name' : channelName }
    if(filterdate){
        request = { 'google_response_details.space.name' : channelName, creation_date: filterdate.creation_date }
    } 

    
    //const alerts =  await Alert.find({google_channel_id})
    const messages= await Message.find(request)

        let result = messagesDataByTimeUnit(messages, timeUnit)
        res.json({ messages: result })
    })

// Route de reception des webhook pipedrive et envoi message à google
router.post('/', async (req, res) => {
    try {
        const alertData = await Alert.findOne({ pipedrive_webhook_id: req.body.meta.webhook_id })
            .populate('user_id')

        // Vérification du statut du deal et du précédent état pour n'envoyer le deal que si statut est passé à won

        if ((req.body.meta.object === 'deal' && req.body.meta.action === 'updated' && req.body.current.status !== 'won') || (req.body?.previous?.status === 'won')) {
            return res.status(202).json({ result: false, message: 'Deal not won or already won , no message sent' })
        }

        let userData = alertData.user_id

        const googleTokenExpDate = new Date(userData.google_tokens.expiration_date)

        if (Date.now() > googleTokenExpDate) {
            const tokens = await refreshGoogleToken(userData)
            if (!tokens.result) {
                // Si le refresh token ne fonctionne pas on renvoie la réponse de Google et un statut 401
                return res.status(401).json(tokens)
            }
            // Puis on met à jour la variable user avec les nouvelles données 
            userData = await User.findOne({ _id: userData._id })
        }

        // Génération du message en fonction des hashtags trouvés dans le message de l'alerte
        let objReceive = req.body.meta.object
        let dealDatas = req.body.current

        let messageFormated = alertData.message.split(' ').map((word, i) => {
            if (word.includes('#')) {
                let firstDiese = word.indexOf('#')
                let beginWord = word.slice(0, firstDiese)

                let lastDiese = word.lastIndexOf('#')
                let endWord = word.slice(lastDiese+1)

                word = word.slice(firstDiese)
                word = word.slice(objReceive.length + 2, lastDiese)
                
                lastDiese = word.lastIndexOf('#')
                if(lastDiese !== -1){
                    word = word.slice(0, lastDiese)
                }
                word = beginWord + dealDatas[word] + endWord
            }
            return word
        })
        messageFormated = messageFormated.join(' ')
        console.log(messageFormated)
        // Puis on fetch le endoint google pour envoyer le message

        const googleResponse = await fetch(`https://chat.googleapis.com/v1/spaces/${alertData.google_channel_id}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${userData.google_tokens.access_token}` },
            body: JSON.stringify({ text: messageFormated })
        })
        const googleData = await googleResponse.json()

        // Puis on va sauvegarder la data en bdd

        let newMessage = new Message({
            message_text: messageFormated,
            alert_id: alertData._id,
            pipedrive_event: req.body,
            google_response_status: googleResponse.status,
            google_response_details: googleData,
            creation_date: Date.now(),
            interactions: 0
        })
        await newMessage.save()

        if (!googleResponse.ok) {
            return response.status(400).json({ result: false, error: 'Fail to send message', data: googleData })
        }

        res.status(200).json({ result: true, message: 'Message sent to Google Chat' })

    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    };


})


// Get Google reactions by message id 

router.get('/reactions/:message_id', async (req, res) => {
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
  

module.exports = router;
