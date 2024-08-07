var express = require('express');
var router = express.Router();
const Message = require('../models/messages')

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
        res.json({messages: filtreData})
    })
})

// Renvoie la liste de tous les messages de l'utilisateur correspondants à l'alert_id envoyé
router.get('/alert/:alert_id', (req, res) => {
    Message.find({alert_id: req.params.alert_id}).then(data => {
        res.json({messages: data})
    })
})

// Renvoie la liste de tous les messages de l'utilisateur correspondants à l'channel_id envoyé
router.get('/channel/:channel_id', (req, res) => {
    Message.find().populate({
        path: "alert_id",
        match: {google_channel_id:  req.params.channel_id}
    }).then(data => {
        let filtreData = data.filter(message => message.alert_id !== null)
        res.json({messages: filtreData})
    })
})

module.exports = router;
