const User = require('../models/users')


const PIPEDRIVE_CLIENT_ID = process.env.PIPEDRIVE_CLIENT_ID;
const PIPEDRIVE_CLIENT_SECRET = process.env.PIPEDRIVE_CLIENT_SECRET;
const PIPEDRIVE_CREDENTIALS_64 = Buffer.from(`${PIPEDRIVE_CLIENT_ID}:${PIPEDRIVE_CLIENT_SECRET}`).toString('base64')
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const refreshPipedriveToken = async (userData) => {

  try 

    {        
      // Appel de la route refresh token de pipedrive

  const response = await fetch ('https://oauth.pipedrive.com/oauth/token',{
            method: 'POST',
            headers: {'Content-type' : 'application/x-www-form-urlencoded',
                        'Authorization' : `Basic ${PIPEDRIVE_CREDENTIALS_64}`
            },
            body: new URLSearchParams({
                grant_type : 'refresh_token',
                refresh_token : userData.pipedrive_tokens.refresh_token,
      }) 
    });

        const data = await response.json()
        if (!response.ok) {
          return {result: false, response : data}
        }
        
        // Mise à jour du token du user en BDD si reponse ok

        await User.updateOne({ _id: userData._id },
          {
              $set: {
                  api_domain: data.api_domain,
                  pipedrive_tokens: {
                      access_token: data.access_token,
                      refresh_token: userData.pipedrive_tokens.refresh_token,
                      expiration_date: Date.now() + data.expires_in * 1000
                  }
              }});

            return {result : true, tokens : data}

    } catch (err) {
      console.log(err)
      return {result: false, error : 'Server Error'}

    }
  
  
  }

   const refreshGoogleToken = async (userData) => {


      try {

       // Appel de la route Google du raffraichissement de token

            const response = await fetch ('https://oauth2.googleapis.com/token',{
                method: 'POST',
                headers: {'Content-type' : 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id : GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    grant_type : 'refresh_token',
                    refresh_token : userData.google_tokens.refresh_token,
          }) 
        });


        const data = await response.json();

        if (!response.ok) {
          return {result: false, response : data}
        }

        // Mise à jour du token user en BDD si reponse ok

        await User.updateOne({ _id : userData._id },
          {
            $set: {
              google_tokens: {
                access_token: data.access_token,
                refresh_token : userData.google_tokens.refresh_token,
                expiration_date: Date.now() + data.expires_in * 1000
              }
            }
          });

        return {result : true, tokens : data}
        } catch(err) {
          console.log (err) 
          return {result : false, error : 'Server error'}

        }

        };



    module.exports = {  refreshPipedriveToken, refreshGoogleToken }