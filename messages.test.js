const request = require('supertest');
const app = require('./app');


it('GET messages/all/:pipedrive_company_id/:pipedrive_user_id/:startDate/:endDate/:timeUnit', async () => {
	const res = await request(app).get('/messages/all/13476443/21658061')

	expect(res.statusCode).toBe(200)
	expect(res.body.result).toEqual(true)
})


it('GET messages/channel/:google_channel_id/:startDate/:endDate/:timeUnit', async () => {
	const res = await request(app).get('/messages/channel/AAAAbAp0eik')

	expect(res.statusCode).toBe(200)
	expect(res.body.result).toEqual(true)
})