var express = require('express');
var router = express.Router();
const User = require('../models/users')
const { refreshPipedriveToken } = require('../modules/refreshTokens')


router.get('/leaderboard/:company_id/:user_id/:startDate/:endDate', async (req, res) => {

    try {
  
    // Récupération du user

    let userData = await User.findOne({ pipedrive_company_id: req.params.company_id, pipedrive_user_id: req.params.user_id })


    if (userData === null) {
     return res.status(404).json({ result: false, error: 'User Not Found' })
    }

        // Après avoir trouvé un user, vérification de la validité du token pour le rafraichir si besoin

        const expirationDate = new Date(userData.pipedrive_tokens.expiration_date).getTime()
  
            if (Date.now() > expirationDate) {

                const tokens = await refreshPipedriveToken(userData)
                console.log(tokens)

                if (!tokens.result) {
                    return  res.status(401).json({result: false, response : tokens})
                } else {
                    console.log('token refreshed')
                }       
                
        // mise à jour de la variable avec données à jour 

                userData = await User.findOne({ _id: userData._id })

                } 


    // Fetch de l'API pipedrive , une fois que nous sommes sur d'avoir un token valide
                
        const dealsResponse = await fetch(`${userData.api_domain}/api/v2/deals`, {
            headers: { 'Authorization': `Bearer ${userData.pipedrive_tokens.access_token}` }
        })
     
        const dealsData = await dealsResponse.json()
        return  res.json({ result: true, deals: dealsData.data})

    } catch(err) {
            console.log(err)
            return res.status(500).json({ result :false, error : 'Server Error'})

    }
    })

module.exports = router;
