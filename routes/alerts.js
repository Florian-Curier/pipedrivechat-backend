var express = require('express');
var router = express.Router();
const Alert = require("../models/alerts")
const User = require("../models/users")


// Enregistre une nouvelle alerte dans la BDD + Créée un webhook pipedrive
router.post("/", (req, res) => {
    const { alert_name, google_channel_id, google_channel_name, trigger_id, trigger_name, message, pipedrive_user_id, pipedrive_comany_id } = req.body

    // Vérifie l'existance de l'user en BDD avec les informations transmises
    User.findOne({ pipedrive_user_id: pipedrive_user_id, pipedrive_comany_id: pipedrive_comany_id }).then(userData => {
        
        if (!userData) {
            res.json({ result: false, error: "User was not found" })
        } else {
            const user = userData

            // Vérifie que le nom de l'alerte n'existe pas déjà et sinon créer l'alerte en BDD et le webhook associé
            Alert.findOne({ alert_name }).then(alertData => {
                if (alertData) {
                    res.json({ result: false, error: "The alert name already exists" })
                } else {
                    // const token = refreshPipedriveToken(user)
                    // let eventType = trigger_name === "Deal Added" ? "added" : "updated"
                    // Requête à l'API pipedrive pour créer le webhhok associé à l'alerte
                    // fetch('https://api-proxy.pipedrive.com/api/v1/webhooks', {
                    //     method: 'POST',
                    //     headers: { Authorization: `Bearer ${token.access_token}` },
                    //     body: new URLSearchParams({
                    //         subscription_url: "https://backend-pipedrive-test.vercel.app/messages",
                    //         event_action: eventType,
                    //         event_object: "deal",
                    //     })
                    // }).then(reponse => reponse.json()).then(webhookData => {
                        // console.log("webhook: ", webhookData)
                        // const pipedrive_webhook_id = webhookData.data.id
                        const pipedrive_webhook_id = "wh0987654321"
                        // Création de l'alerte et enregistrement en BDD
                        const newAlert = new Alert({
                            alert_name,
                            pipedrive_webhook_id,
                            google_channel_id,
                            google_channel_name,
                            user_id: user._id,
                            trigger_id,
                            message,
                            last_update_date: null,
                        })
    
                        newAlert.save().then(newAlertData => {
                            res.json({ result: true, alert: newAlertData })
                        })
                    // })
                }
            })
        }
    })
})



router.get('/:company_id/:user_id', (req, res) => {
    User.findOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id })
    .then (userData => {
      if(userData !== null) {
          Alert.find({user_id : userData._id})
          .populate('trigger_id')
          .then(alertData => {
              res.json({ result: true, alerts : alertData });
  
          });
      } else {
          res.json({ result: false, error: 'user not found' });
      }
    });
  
  });  
  


module.exports = router;
