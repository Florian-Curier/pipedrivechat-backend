var express = require('express');
const User = require('../models/users');
var router = express.Router();
const { refreshGoogleToken } = require('../modules/OAuth')

// ROUTE GET USER

router.get('/:company_id/:user_id', async (req, res) => {

  const userData = await User.findOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id })
  if (userData !== null) {
    res.json({
      result: true,
      user: {
        user_name: userData.pipedrive_user_name,
        pipedrive_user_id: userData.pipedrive_user_id,
        pipedrive_company_id: userData.pipedrive_company_id,
        google_email: userData.google_email,
        api_domain: userData.api_domain,
        registration_date: userData.registration_date,
        last_login_date: userData.last_login_date
      }
    })
  } else {
    res.status(404).json({ result: false, error: 'User Not Found' })
  }
});


// ROUTE GET CHANNELS BY USER

router.get('/channels/:company_id/:user_id', async (req, res) => {

// Recupération du user en BDD

  let userData = await User.findOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id })

  if (userData !== null) {

 // Après avoir trouvé un user, vérification de la validité du token pour le rafraichir si besoin

    const expirationDate = new Date(userData.google_tokens.expiration_date).getTime()


    if (Date.now() > expirationDate) {
      try {

        const tokens = await refreshGoogleToken(userData.google_tokens.refresh_token)

        // Si le raffraichissement renvoie bien acess token, on met à jour la bdd avec le nouveau acess token

        if (tokens.access_token) {
          const updateToken = await User.updateOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id },
            {
              $set: {
                google_tokens: {
                  access_token: tokens.access_token,
                  refresh_token : userData.google_tokens.refresh_token,
                  expiration_date: Date.now() + tokens.expires_in * 1000
                }
              }
            });

         // Puis on met à jour le user avec les nouvelles donéées 

          userData = await User.findOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id }) 
    
        } else {

       // Si le refresh token ne fonctionne pas on renvoie la réponse de Google et un statut 401
          
          res.status(401).json(tokens)
          console.log('failed refresh token')
        }
      }
      catch (err) {
        // Catch des erreurs potentielles
        
        console.log(err)
        res.status(500).json({ result: false, error: 'Server Error' })
      }

    };
    
    // Fetch de l'api Google pour récupérer les channels , une fois qu'on est sur d'avoir un token valide

    const channelsResponse = await fetch('https://chat.googleapis.com/v1/spaces', {
      headers: { 'Authorization': `Bearer ${userData.google_tokens.access_token}` }
    })

    const channels = await channelsResponse.json()


    // Si réponse ok on renvoie la liste des channels

    if (channelsResponse.status === 200) {
      res.json({ result: true, channels: channels.spaces })
    } else {

    // Si erreur on renvoie le code dans le HTTP et le message d'erreur dans error
      
      res.status(channels.error.code).json({ result: false, error: channels.error })
    }

  

  } else { 

     //Erreur  utilisateur not found en BDD  (if initial)
    res.status(404).json({ result: false, error: 'User Not Found' })
  }

});

module.exports = router;
