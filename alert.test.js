const request = require('supertest')
const app = require ('./app')

//permet de s'assurer que la route gère correctement les erreurs lorsque des données incomplètes sont envoyées pour créer une nouvelle alerte 
describe ('POST /alerts', () => {
     it ('Should return an error if required fields are missing', async () => {
        const res = await request(app)
            .post('/alerts')
            .send({
                google_channel_id: 'channel_id',
                google_channel_name: 'channel_name',
            });
        expect(res.statusCode).toBe(400); 
        expect(res.body.error).toBe('Missing or empty fields');
    });
});