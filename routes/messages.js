var express = require('express');
var router = express.Router();
const Message = require('../models/messages')
const Alert = require('../models/alerts')
const User = require('../models/users')
const { refreshGoogleToken } = require('../modules/refreshTokens')

// Renvoie la liste de tous les messages de l'utilisateur
router.get('/:pipedrive_company_id/:pipedrive_user_id', (req, res) => {
    Message.find().populate({
        path: 'alert_id',
        populate: {
            path: 'user_id',
            match: {
                pipedrive_company_id: req.params.pipedrive_company_id,
                pipedrive_user_id: req.params.pipedrive_user_id
            }
        }
    }).then(data => {
        let filtreData = data.filter(message => message.alert_id.user_id !== null)
        res.json({ messages: filtreData })
    })
})

// Renvoie la liste de tous les messages de l'utilisateur correspondants à l'alert_id envoyé
router.get('/alert/:alert_id', (req, res) => {
    Message.find({ alert_id: req.params.alert_id }).then(data => {
        res.json({ messages: data })
    })
})

// Renvoie la liste de tous les messages de l'utilisateur correspondants à l'channel_id envoyé
router.get('/channel/:channel_id', (req, res) => {
    Message.find().populate({
        path: "alert_id",
        match: { google_channel_id: req.params.channel_id }
    }).then(data => {
        let filtreData = data.filter(message => message.alert_id !== null)
        res.json({ messages: filtreData })
    })
})

// Route de reception des webhook pipedrive et envoi message à google

router.post('/', async (req, res) => {

    try
     {
        const alertData = await Alert.findOne({ pipedrive_webhook_id: req.body.meta.webhook_id})
            .populate('user_id')
            .populate('trigger_id')

        let userData = alertData.user_id
        let triggerData = alertData.trigger_id


        const expirationDate = new Date(userData.google_tokens.expiration_date)

        if (Date.now() > expirationDate) {
            const tokens = await refreshGoogleToken(userData)
            if (!tokens.result) {
                // Si le refresh token ne fonctionne pas on renvoie la réponse de Google et un statut 401
                return res.status(401).json(tokens)
            }
            // Puis on met à jour la variable user avec les nouvelles donéées 
            userData = await User.findOne({ _id: userData._id })
        }

        let message;

        // On vérifie si il existe un message personnalisé pour choisir le texte à envoyer

        if (alertData.message) {
            message = alertData.message
        } else {
            message = triggerData.default_message
        }

        // Puis on fetch le endoint google pour envoyer le message

        const googleResponse = await fetch(`https://chat.googleapis.com/v1/spaces/${alertData.google_channel_id}/messages`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${userData.google_tokens.access_token}`},
            body: JSON.stringify({ text: message })
        })
        const googleData = await googleResponse.json()

        // Puis on va sauvegarder la data en bdd

        let newMessage = new Message({
            message_text: message,
            alert_id: alertData._id,
            pipedrive_event: req.body,
            google_response_status: googleResponse.status,
            google_response_details: googleData,
            creation_date: Date.now(),
            interactions: 0
        })
        await newMessage.save()

    } catch (err) {
        console.log(err)
    };
    res.sendStatus(200)

})

module.exports = router;
