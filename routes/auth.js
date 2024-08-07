var express = require('express');
var router = express.Router();
const User = require('../models/users')
const {jwtDecode} = require('jwt-decode')

// Définition variable + import variable env

const PIPEDRIVE_CLIENT_ID = process.env.PIPEDRIVE_CLIENT_ID;
const PIPEDRIVE_CLIENT_SECRET = process.env.PIPEDRIVE_CLIENT_SECRET;
const PIPEDRIVE_CALLBACK_URI = process.env.PIPEDRIVE_CALLBACK_URI;
const PIPEDRIVE_CREDENTIALS_64 = Buffer.from(`${PIPEDRIVE_CLIENT_ID}:${PIPEDRIVE_CLIENT_SECRET}`).toString('base64')
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URI = process.env.GOOGLE_CALLBACK_URI;
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/chat.messages https://www.googleapis.com/auth/chat.spaces https://www.googleapis.com/auth/userinfo.email'

// Authorize pipedrive > redirection vers l'url d'autorisation pour avoir le code

router.get('/pipedrive', (req, res)=>{
    res.redirect(`https://oauth.pipedrive.com/oauth/authorize?client_id=${PIPEDRIVE_CLIENT_ID}&redirect_uri=${PIPEDRIVE_CALLBACK_URI}`)
})


// Callback pipedrive > échange du code d'autorisation contre les token et création du user

router.get ('/pipedrive/callback', async (req, res ) => {

    // Récupération du code dans la query puis fetch 

    const code = req.query.code

    try {

        const tokensResponse =  await fetch ('https://oauth.pipedrive.com/oauth/token',{
            method: 'POST',
            headers: {'Content-type' : 'application/x-www-form-urlencoded',
                        'Authorization' : `Basic ${PIPEDRIVE_CREDENTIALS_64}`
            },
            body: new URLSearchParams({
                grant_type : 'authorization_code',
                redirect_uri : PIPEDRIVE_CALLBACK_URI,
                code : code
      }) 
    });

        const tokens = await tokensResponse.json()

        // Puis on récupère le profile du user pipedrive avec le token

        const profileResponse = await fetch(`${tokens.api_domain}/v1/users/me`,{
            headers:{ 'Authorization': `Bearer ${tokens.access_token}`}
          })

        const profileJson = await profileResponse.json()
        const profile = profileJson.data

        // verification si user existe en BDD et création si n'existe pas

        let user = await User.findOne({pipedrive_user_id: profile.id, pipedrive_company_id: profile.company_id}) 
        if (!user) {
            user = new User({
                pipedrive_user_name: profile.name,
                pipedrive_user_id: profile.id,
                pipedrive_company_id: profile.company_id,
                api_domain: tokens.api_domain,
                google_email: null,
                pipedrive_tokens: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiration_date : Date.now() + tokens.expires_in * 1000
                },
                google_tokens: null,
                registration_date : Date.now(),
                last_login_date : Date.now()

            })
            await user.save();

        }   else {

            // mise à jour du user si il existz déja
            user = await User.updateOne(
                {pipedrive_user_id: profile.id, pipedrive_company_id: profile.company_id }, 
                { $set : {
                pipedrive_user_name: profile.name,
                pipedrive_user_id: profile.id,
                pipedrive_company_id: profile.company_id,
                api_domain: tokens.api_domain,
                pipedrive_tokens: {
                    access_token: tokens.access_token,
                    refresh_token: tokens.refresh_token,
                    expiration_date : Date.now() + tokens.expires_in * 1000
                },
                last_login_date : Date.now()
                }
    });
        };
        // Redirection vers autorisation GOOGLE pour poursuivre l'install , on transmet les users id dans le state pour les récupérer après
        res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URI}&response_type=code&access_type=offline&scope=${GOOGLE_SCOPE}&state=${profile.id} ${profile.company_id} ${tokens.api_domain}`)

    } catch (err) {
        console.log(err);
        res.status(500).json({result: false, error: 'Sever Error'})
    };
}); 

// Autorisation Google

// Callback Google > echange du code avec les tokens

router.get ('/google/callback', async (req, res ) => {
    const code = req.query.code;
    const state = req.query.state; // on récupère le state transmis avant pour retrouver le user en BDD
    const splitState = state.split(' ');

    try {
        const tokensResponse = await fetch ('https://oauth2.googleapis.com/token',{
            method: 'POST',
            headers: {'Content-type' : 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id : GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                grant_type : 'authorization_code',
                redirect_uri : GOOGLE_CALLBACK_URI,
                code : code
            })
        });

        const tokens = await tokensResponse.json()

        const profile =  jwtDecode(tokens.id_token) // decode jwt avec les infos user

        //mise jour du user avec les infos en BDD

        const userGoogle = await User.updateOne(
                        {pipedrive_user_id : splitState[0], pipedrive_company_id: splitState[1]},
                        {$set: {
                            google_tokens :   {
                            access_token: tokens.access_token,
                            refresh_token: tokens.refresh_token,
                            expiration_date : Date.now() + tokens.expires_in * 1000
                        },
                            google_email: profile.email
                        }}
        )
    res.redirect(`http://localhost:3001/install-confirmation?domain=${splitState[2]}&client_id=${PIPEDRIVE_CLIENT_ID}&company_id=${splitState[1]}&user_id=${splitState[0]}`)
}    catch(err) {
    console.log(err)
    res.status(500).json({result: false, error: 'Sever Error'})

}}
); 



/* 

Route unused car redirection depuis la route call back pipedrive

router.get('/google', (req, res) => {
    const user_id = req.query.user_id
    const company_id = req.query.company_id
    const domain = req.query.domain


    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URI}&response_type=code&access_type=offline&scope=${GOOGLE_SCOPE}&state=${user_id} ${company_id} ${domain}`)

})
 */


module.exports = router;
