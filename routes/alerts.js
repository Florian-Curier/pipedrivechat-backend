var express = require('express');
var router = express.Router();

// Ecrire les routes ici

const Alert = require("../models/alerts")

router.post("/alerts", (req,res) => {
    
    Alert.find({}).then(data => {

    const newAlert = new Alert({
        alert_name: req.body.alert_name,
        pipedrive_webhook: req.body.pipedrive_webhook,
       
    })
    })
})
module.exports = router;
