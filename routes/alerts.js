var express = require('express');
var router = express.Router();
const { refreshPipedriveToken } = require ('../modules/refreshTokens')
const Alert = require("../models/alerts")
const User = require("../models/users")


// Enregistre une nouvelle alerte dans la BDD + Créée un webhook pipedrive
router.post("/", async (req, res) => {
    const { alert_name, google_channel_id, google_channel_name, trigger_id, trigger_name, message, pipedrive_user_id, pipedrive_company_id } = req.body

    // Vérifie l'existance de l'user en BDD avec les informations transmises

        let userData = await User.findOne({ pipedrive_user_id: pipedrive_user_id, pipedrive_company_id: pipedrive_company_id })
        
        if (!userData) {
          return  res.status(404).json({ result: false, error: "User was not found" })
        } 
        // Vérifie que le nom de l'alerte n'existe pas déjà et sinon créer l'alerte en BDD et le webhook associé

          const alertData = await  Alert.findOne({ alert_name })
                if (alertData) {
                     return res.status(400).json({ result: false, error: "The alert name already exists" })
                     } 

        const expirationDate = new Date(userData.pipedrive_tokens.expiration_date).getTime()
  
              if (Date.now() > expirationDate) {
    
                    const tokens = await refreshPipedriveToken(userData)
                    console.log(tokens)
    
                    if (!tokens.result) {
                        return  res.status(401).json({result: false, response : tokens})
                    } else {
                        console.log('token refreshed')
                    }  }

          userData = await User.findOne({_id: userData._id }) 

        let eventType = trigger_name === "Deal Added" ? "added" : "updated"
         
        // Requête à l'API pipedrive pour créer le webhhok associé à l'alerte
        const webhookResponse = await fetch('https://api-proxy.pipedrive.com/api/v1/webhooks', {
                         method: 'POST',
                         headers: { Authorization: `Bearer ${userData.pipedrive_tokens.access_token}` },
                         body: new URLSearchParams({
                             subscription_url: "https://pipedrivechat-backend.vercel.app/messages",
                             event_action: eventType,
                             event_object: "deal",
                         })
                     })
                webhookData = await webhookResponse.json()


                         console.log("webhook: ", webhookData)
                const pipedrive_webhook_id = webhookData.data.id
                        //const pipedrive_webhook_id = "wh0987654321"
                        // Création de l'alerte et enregistrement en BDD
              const newAlert = new Alert({
                            alert_name,
                            pipedrive_webhook_id,
                            google_channel_id,
                            google_channel_name,
                            user_id: userData._id,
                            trigger_id,
                            message,
                            last_update_date: null,
                        });
    
                    const newAlertData = await newAlert.save()

                    res.json({result : true , newAlert: newAlertData})
        
                     });
            
            
        


// Renvoie une alerte en fonction de l'id renseigné
router.get('/:alert_id', (req, res) => {
    Alert.findOne({_id: req.params.alert_id}).then(alert => {
        if(!alert){
            res.json({result: false, error: "Alert not found"})
        } else{
            res.json({result: true, alert})
        }
    })
})

// Modifie une alerte
router.put('/', (req, res) => {
    const { alert_id, google_channel_id, google_channel_name, trigger_id, trigger_name, message } = req.body

    Alert.updateOne({_id: alert_id}, {google_channel_id, google_channel_name, trigger_id, trigger_name, message, last_update_date: Date.now()}).then(alert => {
        if(alert.modifiedCount > 0){
            res.json({result: true})
        } else {
            res.json({result: false, error: "Unable to modify alert"})
        }
    })
})

// Supprime une alerte
router.delete('/:alert_id', (req, res) => {
    Alert.deleteOne({_id: req.params.alert_id}).then(data => {
        if(data.deletedCount > 0){
            res.json({result: true})
        } else {
            res.json({result: false, error: "Unable to delete alert"})
        }
    })
})


// Renvoie la liste des alertes de l'utilisateur
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
