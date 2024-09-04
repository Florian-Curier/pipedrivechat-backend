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

it('POST messages', async () => {
	const res = await request(app).post('/messages').send(

		{
			"v": 1,
			"matches_filters": {
			  "current": []
			},
			"meta": {
			  "action": "added",
			  "change_source": "app",
			  "company_id": 13476443,
			  "host": "johan-sandbox3.pipedrive.com",
			  "id": 61,
			  "is_bulk_update": false,
			  "matches_filters": {
				"current": []
			  },
			  "object": "deal",
			  "permitted_user_ids": [
				21180837,
				21658061,
				21658072,
				21669270,
				21722389
			  ],
			  "pipedrive_service_name": false,
			  "timestamp": 1725483973,
			  "timestamp_micro": 1725483973370404,
			  "prepublish_timestamp": 1725483973481,
			  "trans_pending": false,
			  "user_id": 21669270,
			  "v": 1,
			  "webhook_id": "576417"
			},
			"current": {
			  "email_messages_count": 0,
			  "cc_email": "johan-sandbox3+deal61@pipedrivemail.com",
			  "channel": null,
			  "products_count": 0,
			  "acv_currency": null,
			  "next_activity_date": null,
			  "acv": null,
			  "next_activity_type": null,
			  "local_close_date": null,
			  "next_activity_duration": null,
			  "id": 61,
			  "person_id": 19,
			  "creator_user_id": 21669270,
			  "expected_close_date": null,
			  "owner_name": "Felix",
			  "arr_currency": null,
			  "participants_count": 0,
			  "stage_id": 1,
			  "probability": null,
			  "undone_activities_count": 0,
			  "active": true,
			  "local_lost_date": null,
			  "person_name": "Felix",
			  "last_activity_date": null,
			  "close_time": null,
			  "org_hidden": false,
			  "next_activity_id": null,
			  "weighted_value_currency": "USD",
			  "local_won_date": null,
			  "stage_order_nr": 0,
			  "next_activity_subject": null,
			  "rotten_time": null,
			  "user_id": 21669270,
			  "visible_to": "3",
			  "org_id": 17,
			  "notes_count": 0,
			  "next_activity_time": null,
			  "channel_id": null,
			  "formatted_value": "$0",
			  "status": "open",
			  "formatted_weighted_value": "$0",
			  "mrr_currency": null,
			  "first_won_time": null,
			  "origin": "ManuallyCreated",
			  "last_outgoing_mail_time": null,
			  "origin_id": null,
			  "title": "test orga deal",
			  "last_activity_id": null,
			  "update_time": "2024-09-04 21:06:13",
			  "activities_count": 0,
			  "pipeline_id": 1,
			  "lost_time": null,
			  "currency": "USD",
			  "weighted_value": 0,
			  "org_name": "test orga",
			  "value": 0,
			  "person_hidden": false,
			  "next_activity_note": null,
			  "arr": null,
			  "files_count": 0,
			  "last_incoming_mail_time": null,
			  "label": null,
			  "mrr": null,
			  "lost_reason": null,
			  "deleted": false,
			  "won_time": null,
			  "followers_count": 0,
			  "stage_change_time": null,
			  "add_time": "2024-09-04 21:06:13",
			  "done_activities_count": 0
			},
			"previous": null,
			"retry": 0,
			"event": "added.deal"
		  })



	expect(res.statusCode).toBe(200)
})

