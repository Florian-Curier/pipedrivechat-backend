var express = require('express');
const User = require('../models/users');
var router = express.Router();

// GET user by company id & user id
router.get('/:company_id/:user_id', (req, res)  => {

  User.findOne({ pipedrive_user_id : req.params.user_id, pipedrive_company_id : req.params.company_id})
  .then(userData => {
    if(userData !== null) {
      res.json({ result : true,
                 user: {
                  user_name : userData.pipedrive_user_name,
                  pipedrive_user_id : userData.pipedrive_user_id,
                  pipedrive_company_id: userData.pipedrive_company_id,
                  google_email: userData.google_email,
                  api_domain: userData.api_domain,
                  registration_date : userData.registration_date,
                  last_login_date: userData.last_login_date
                 } 
      })
    } else {
      res.status(404).json({result : false, error : 'User Not Found' })
    }
  })

});

module.exports = router;
