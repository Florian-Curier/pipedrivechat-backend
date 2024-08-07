var express = require('express');
var router = express.Router();

// Ecrire les routes ici

const Alert = require("../models/alerts")
const User = require("../models/users")

router.post("/", (req,res) => {
    
    Alert.find({}).then(data => {

    const newAlert = new Alert({
        alert_name: req.body.alert_name,
        pipedrive_webhook: req.body.pipedrive_webhook,
       
    })
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
