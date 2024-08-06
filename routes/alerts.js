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

router.get('/test', (req, res) => {
    Alert.find()
    .populate('user_id')
    .then(data => {
        
      res.json({ allUsers: data });
    });
   });



 router.get('/:company_id/:user_id', (req, res) => {
  User.findOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id })
  .then (userData => {
        console.log(userData)

        Alert.find({user_id : userData._id})
        .populate('trigger_id')
        
        .then(alertData => {
            console.log(alertData)
            res.json({ alert: alertData });

        });
  });

}); 




module.exports = router;
