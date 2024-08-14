var express = require('express');
const User = require('../models/users');
var router = express.Router();
const { refreshGoogleToken, refreshPipedriveToken } = require('../modules/refreshTokens')

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

  try {

    let userData = await User.findOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id })
    if (userData === null) {
      return res.status(404).json({ result: false, error: 'User Not Found' })
    }

    // Après avoir trouvé un user, vérification de la validité du token pour le rafraichir si besoin
    const expirationDate = new Date(userData.google_tokens.expiration_date).getTime()
    if (Date.now() > expirationDate) {
      const tokens = await refreshGoogleToken(userData)
      if (!tokens.result) {
        // Si le refresh token ne fonctionne pas on renvoie la réponse de Google et un statut 401
        console.log('failed refresh token')
        return res.status(401).json(tokens)

      } else {
        console.log('token refreshed')
      }
      // Puis on met à jour la variable user avec les nouvelles donéées 
      userData = await User.findOne({ _id: userData._id })

    }

    // Fetch de l'api Google pour récupérer les channels , une fois qu'on est sur d'avoir un token valide
    const channelsResponse = await fetch('https://chat.googleapis.com/v1/spaces', {
      headers: { 'Authorization': `Bearer ${userData.google_tokens.access_token}` }
    })

    const channels = await channelsResponse.json()
    // Si réponse ok on renvoie la liste des channels avec un filtre pour exclure les DM

    if (channelsResponse.ok) {
      let channelsFiltered = channels.spaces.filter(e => e.spaceType === 'SPACE')
      res.json({ result: true, channels: channelsFiltered })

    } else {
      // Si erreur on renvoie le code dans le HTTP et le message d'erreur dans error   
      res.status(channels.error.code).json({ result: false, error: channels.error })
    }
  }
  catch (err) {
    // Catch des erreurs potentielles
    console.log(err)
    res.status(500).json({ result: false, error: 'Server Error' })
  }

});


// ROUTE GET WEBHOKKS BY USER : remonte tous les webhooks d'un user

router.get('/webhooks/:company_id/:user_id', async (req, res) => {

  try {

    let userData = await User.findOne({ pipedrive_user_id: req.params.user_id, pipedrive_company_id: req.params.company_id })
    if (userData === null) {
      return res.status(404).json({ result: false, error: 'User Not Found' })
    }

    // Après avoir trouvé un user, vérification de la validité du token pour le rafraichir si besoin
    const expirationDate = new Date(userData.pipedrive_tokens.expiration_date).getTime()
    if (Date.now() > expirationDate) {
      const tokens = await refreshPipedriveToken(userData)
      if (!tokens.result) {
        // Si le refresh token ne fonctionne pas on renvoie la réponse de Google et un statut 401
        return res.status(401).json(tokens)
      }
    }

    // Mise à jour du sur puis fetch des webhooks
    userData = await User.findOne({ _id: userData._id })
    const webhooksResponse = await fetch(`${userData.api_domain}/v1/webhooks`, {
      headers: { 'Authorization': `Bearer ${userData.pipedrive_tokens.access_token}` }
    })
    const webhooksData = await webhooksResponse.json()
    res.json({ result: true, webhooks: webhooksData.data })

  } catch (err) {
    console.log(err)
    res.status(500).json({ result: false, error: 'Server Error' })
  }
});

// ROUTE DE LOGOUT GOOGLE

router.put('/googleLogout/', async (req, res) => {

  const { pipedrive_user_id, pipedrive_company_id } = req.body

  const updateUser = await User.updateOne({pipedrive_user_id, pipedrive_company_id },
                          {google_tokens: null, google_email: null})
  
  if (updateUser.modifiedCount > 0) {

    res.json({result: true, message: 'User Logged out' })
  } else {
    res.status(500).json({result: false, error: 'Unable to logout user'})
  }






})


module.exports = router;
