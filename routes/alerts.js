var express = require('express');
var router = express.Router();
const { refreshPipedriveToken } = require ('../modules/refreshTokens')
const { checkBody } = require('../modules/checkBody')
const { isValidObjectId } = require ('mongoose');
const Alert = require("../models/alerts")
const User = require("../models/users")


// Enregistre une nouvelle alerte dans la BDD + Créée un webhook pipedrive

router.post("/", async (req, res) => {

    if (!checkBody(req.body, ['alert_name', 'google_channel_id', 'google_channel_name','trigger_id', 'trigger_name', 'message', 'pipedrive_user_id', 'pipedrive_company_id' ])) {
        return  res.status(400).json({ result: false, error: 'Missing or empty fields' });
        
      }

    const { alert_name, google_channel_id, google_channel_name, trigger_id, trigger_name, message, pipedrive_user_id, pipedrive_company_id } = req.body
      try
         
        {  
   
         // Vérifie l'existance du user en BDD

        let userData = await User.findOne({ pipedrive_user_id: pipedrive_user_id, pipedrive_company_id: pipedrive_company_id })
        
        if (!userData) {
          return  res.status(404).json({ result: false, error: "User was not found" })
        } 
        // Vérifie que le nom de l'alerte n'existe pas déjà 

          const alertData = await  Alert.findOne({ alert_name })
                if (alertData) {
                     return res.status(400).json({ result: false, error: "The alert name already exists" })
                     } 

        // Vérifier la validité du token pipedrive et le raffraichir si besoin

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

        // Requête à l'API pipedrive pour créer le webhhok associé à l'alerte en déterminant le type d'envent

        let eventType = trigger_name === "Deal Added" ? "added" : "updated"
         

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

            const routeResponse = await Alert.findOne({_id : newAlert._id}).populate('trigger_id')

                    res.json({result : true , newAlert: routeResponse})

             } catch(err){
                console.log(err)
                res.status(500).json({result : true, error : 'Server Error'})
             }
        
                     });
            
            
        


// Renvoie une alerte en fonction de l'id renseigné
router.get('/:alert_id', (req, res) => {

    if (!isValidObjectId(req.params.alert_id)){
        return res.status(400).json({result: false, error : 'Invalid ObjectId'})
    }
    
    Alert.findOne({_id: req.params.alert_id}).populate('trigger_id')
    .then(alert => {
        if(!alert){
            res.json({result: false, error: "Alert not found"})
        } else{
            res.json({result: true, alert})
        }
    })
})

// Modifie une alerte
router.put('/', (req, res) => {

    if (!checkBody(req.body, ['alert_id', 'alert_name', 'google_channel_id', 'google_channel_name', 'message'])) {
        return  res.status(400).json({ result: false, error: 'Missing or empty fields' });
      }
    const { alert_id, alert_name, google_channel_id, google_channel_name,  message } = req.body
         Alert.updateOne({_id: alert_id}, {alert_name, google_channel_id, google_channel_name , message, last_update_date: Date.now()}).then(alert => {
        if(alert.modifiedCount > 0){
            res.json({result: true, message : 'Alert Updated'})
        } else {
            res.status(400).json({result: false, error: "Unable to modify alert"})
        }
    })   
})

// Supprime une alerte et le webhook associé
router.delete('/:alert_id', async (req, res) => {

try
    {
    const alertData = await Alert.findOne({_id : req.params.alert_id}).populate('user_id')

        if (alertData === null) {
            return res.status(404).json({result : false , error : 'Alert ID does not exist'})
        }

        let userData = alertData.user_id;
        const expirationDate = new Date(userData.pipedrive_tokens.expiration_date).getTime();

        if (Date.now() > expirationDate) {

            const tokens = await refreshPipedriveToken(userData)

            if (!tokens.result) {
            // Si le refresh token ne fonctionne pas on renvoie la réponse de Google et un statut 401
            return res.status(401).json(tokens)
            } 
        };

        // Mise à jour du user puis supression du webhook pipedrive

        userData = await User.findOne({_id : userData._id})

        const webhooksResponse = await fetch(`${userData.api_domain}/v1/webhooks/${alertData.pipedrive_webhook_id}`, {
            method : 'DELETE',
            headers: {'Authorization' : `Bearer ${userData.pipedrive_tokens.access_token}`}
        })

        const webhooksData = await webhooksResponse.json()

        console.log(webhooksData)

        if (!webhooksResponse.ok) {
            return res.status(400).json({result: false , error : 'Unable to delete webhook'})
        }

        const deleteAlert = await  Alert.deleteOne({_id: req.params.alert_id})

        if(deleteAlert.deletedCount === 0){
            return res.json(400).json({result : false , error : 'Unalbe to delete alert'})
        }

        res.json({result : true, message : 'Alert and webhook deleted'})

} catch (err) {

    console.log(err)
    res.status(500).json({result : false , error : 'Server Error'})
}
       
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
