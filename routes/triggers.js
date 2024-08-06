var express = require('express');
var router = express.Router();

// Ecrire les routes ici

const Trigger = require("../models/triggers")

router.get("/", (req, res) => {
    Trigger.find()
    .then(triggers => {
        res.json({triggers: triggers})
    })
})

module.exports = router;
