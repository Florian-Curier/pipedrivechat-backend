var express = require('express');
var router = express.Router();
const User = require('../models/users')
const { refreshPipedriveToken , refreshGoogleToken } = require('../modules/refreshTokens')
const moment = require('moment');
var express = require('express');
var router = express.Router();
const { isValidObjectId } = require('mongoose');
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');


const CLOUDINARY_URL = process.env.CLOUDINARY_URL


router.get('/leaderboard/:company_id/:user_id/:startDate/:endDate/:timeUnit', async (req, res) => {

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

    router.get('/turnover/:company_id/:user_id/:startDate/:endDate/:timeUnit', async (req, res) => {

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
                    
            const dealsResponse = await fetch(`${userData.api_domain}/api/v2/deals?status=won`, {
                headers: { 'Authorization': `Bearer ${userData.pipedrive_tokens.access_token}` }
            })
         
            const dealsData = await dealsResponse.json()
            // console.log(dealsData.data)

            const startDate = new Date(req.params.startDate);
            const endDate = new Date(req.params.endDate);

              const filteredDealsData = dealsData.data.filter(deal => {
        const date = new Date(deal.won_time);
        return date >= startDate && date <= endDate;

    });

    if (req.params.timeUnit === 'month') {
        const monthlySums = filteredDealsData.reduce((acc, deal) => {
            const month = moment(deal.won_time).format('YYYY-MM');
            acc[month] = (acc[month] || 0) + deal.value;
            return acc;
        }, {});
    
        const resultArray = Object.keys(monthlySums)
            .sort()  
            .map(month => ({
                won_time: moment(month, 'YYYY-MM').format('MMMM YYYY'),
                value: monthlySums[month]
            }));

        return res.json({ result: true, deals: resultArray });
    }
    if (req.params.timeUnit === 'week') {
        const weeklySums = filteredDealsData.reduce((acc, deal) => {
            const weekStart = moment(deal.won_time).startOf('isoWeek'); // Start week on Monday
            const weekEnd = moment(deal.won_time).endOf('isoWeek');
            const weekKey = weekStart.format('WW YYYY');
            acc[weekKey] = (acc[weekKey] || 0) + deal.value;
            return acc;
        }, {});
    
        const resultArray = Object.keys(weeklySums)
            .sort()  
            .map(weekKey => {
                const [weekNumber, year] = weekKey.split(' ');
                const weekStart = moment(weekKey, 'WW YYYY').startOf('isoWeek').format('MMMM D');
                const weekEnd = moment(weekKey, 'WW YYYY').endOf('isoWeek').format('MMMM D');
                return {
                    won_time: `Week ${weekNumber}, ${year} (${weekStart} - ${weekEnd})`,
                    value: weeklySums[weekKey]
                };
            });
    
        return res.json({ result: true, deals: resultArray });
    }
    if (req.params.timeUnit === 'year') {
        const yearlySums = filteredDealsData.reduce((acc, deal) => {
            const year = moment(deal.won_time).format('YYYY');
            acc[year] = (acc[year] || 0) + deal.value;
            return acc;
        }, {});

        const resultArray = Object.keys(yearlySums)
            .sort()  
            .map(year => ({
                won_time: year,
                value: yearlySums[year]
            }));

        return res.json({ result: true, deals: resultArray });
    }

    if (req.params.timeUnit === 'day') {
        const dailySums = filteredDealsData.reduce((acc, deal) => {
            const day = moment(deal.won_time).format('YYYY-MM-DD');
            acc[day] = (acc[day] || 0) + deal.value;
            return acc;
        }, {});
    
        const resultArray = Object.keys(dailySums)
            .sort()  
            .map(day => ({
                won_time: day,   
                value: dailySums[day]
            }));
    
        return res.json({ result: true, deals: resultArray });
    }

    if (req.params.timeUnit === 'quarter') {
        const quarterlySums = filteredDealsData.reduce((acc, deal) => {
            const quarter = moment(deal.won_time).format('Q YYYY');
            acc[quarter] = (acc[quarter] || 0) + deal.value;
            return acc;
        }, {});
    
        const resultArray = Object.keys(quarterlySums)
            .sort()  
            .map(quarter => {
                const [quarterNumber, year] = quarter.split(' ');
                return {
                    won_time: `Q${quarterNumber} ${year}`,
                    value: quarterlySums[quarter]
                };
            });
    
        return res.json({ result: true, deals: resultArray });
    }

    console.log(filteredDealsData)



            return  res.json({ result: true, deals: filteredDealsData})
    
        } catch(err) {
                console.log(err)
                return res.status(500).json({ result :false, error : 'Server Error'})
    
        }
        })


    router.post('/sendChart', async (req, res) => {
          
            const { pipedrive_company_id, pipedrive_user_id, google_channel_id, dashboard_name, picture } = req.body
            let pictureUrl = ''
          
            try {
          
              let userData = await User.findOne({ pipedrive_company_id, pipedrive_user_id })
          
              // Recupération de l'image 
          
            //   const photoPath = `./tmp/${uniqid()}.jpg`
            //   const resultMove = await req.files.picture.mv(photoPath);
          
              //Upload cloudinary
          
              if (picture) {
          
                const resultCloudinary = await cloudinary.uploader.upload(picture);
                // fs.unlinkSync(photoPath)
                pictureUrl = resultCloudinary.secure_url
          
              } else {
                return res.status(500).json({ result: false, error: 'Error whilde uploading picture' })
              }
          
              // Refresh du token
          
              const expirationDate = new Date(userData.google_tokens.expiration_date).getTime()
              if (Date.now() > expirationDate) {
                const tokens = await refreshGoogleToken(userData)
                if (!tokens.result) {
                  console.log('failed refresh token')
                  return res.status(401).json(tokens)
                }
                userData = await User.findOne({ _id: userData._id })
              }
          
              // Fetch google pour envoyer le message
              
              const googleResponse = await fetch(`https://chat.googleapis.com/v1/spaces/${google_channel_id}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userData.google_tokens.access_token}` },
                body: JSON.stringify({
                    text : `${dashboard_name} :${pictureUrl}`
                          })
                        })
          
              const googleData = await googleResponse.json()
          
          
          
              if (!googleResponse.ok) {
                return res.status(500).json({ result: false, error: 'Error while sending message', googleData })
              }
          
              res.json({ result: true, message : 'Dashboard Sent' })
          
            } catch (err) {
          
              console.log(err)
              res.status(500).json('Server Error')
            }
          
          })

module.exports = router;
