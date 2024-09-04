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
			  "action": "updated",
			  "change_source": "app",
			  "company_id": 13476443,
			  "host": "johan-sandbox3.pipedrive.com",
			  "id": 49,
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
			  "timestamp": 1723793131,
			  "timestamp_micro": 1723793131829509,
			  "prepublish_timestamp": 1723793131935,
			  "trans_pending": false,
			  "user_id": 21669270,
			  "v": 1,
			  "webhook_id": "520458"
			},
			"current": {
			  "email_messages_count": 0,
			  "cc_email": "johan-sandbox3+deal49@pipedrivemail.com",
			  "channel": null,
			  "products_count": 0,
			  "acv_currency": null,
			  "next_activity_date": null,
			  "acv": null,
			  "next_activity_type": null,
			  "local_close_date": "2024-08-16",
			  "next_activity_duration": null,
			  "id": 49,
			  "person_id": 26,
			  "creator_user_id": 21180837,
			  "expected_close_date": null,
			  "owner_name": "Johan",
			  "arr_currency": null,
			  "participants_count": 1,
			  "stage_id": 2,
			  "probability": null,
			  "undone_activities_count": 0,
			  "active": false,
			  "local_lost_date": null,
			  "person_name": "Daniel Hardman",
			  "last_activity_date": null,
			  "close_time": "2024-08-16 07:25:31",
			  "org_hidden": false,
			  "next_activity_id": null,
			  "weighted_value_currency": "USD",
			  "local_won_date": "2024-08-16",
			  "stage_order_nr": 1,
			  "next_activity_subject": null,
			  "rotten_time": null,
			  "user_id": 21180837,
			  "visible_to": "3",
			  "org_id": 23,
			  "notes_count": 0,
			  "next_activity_time": null,
			  "channel_id": null,
			  "formatted_value": "$4,000",
			  "status": "won",
			  "formatted_weighted_value": "$4,000",
			  "mrr_currency": null,
			  "first_won_time": "2024-08-16 07:25:31",
			  "origin": "ManuallyCreated",
			  "last_outgoing_mail_time": null,
			  "origin_id": null,
			  "title": "Pearson - Hardman deal",
			  "last_activity_id": null,
			  "update_time": "2024-08-16 07:25:31",
			  "activities_count": 0,
			  "pipeline_id": 1,
			  "lost_time": null,
			  "currency": "USD",
			  "weighted_value": 4000,
			  "org_name": "Pearson - Hardman",
			  "value": 4000,
			  "person_hidden": false,
			  "next_activity_note": null,
			  "arr": null,
			  "files_count": 0,
			  "last_incoming_mail_time": null,
			  "label": null,
			  "mrr": null,
			  "lost_reason": null,
			  "deleted": false,
			  "won_time": "2024-08-16 07:25:31",
			  "followers_count": 1,
			  "stage_change_time": null,
			  "add_time": "2024-08-12 10:59:40",
			  "done_activities_count": 0
			},
			"previous": {
			  "email_messages_count": 0,
			  "cc_email": "johan-sandbox3+deal49@pipedrivemail.com",
			  "channel": null,
			  "products_count": 0,
			  "acv_currency": null,
			  "next_activity_date": null,
			  "acv": null,
			  "next_activity_type": null,
			  "local_close_date": null,
			  "next_activity_duration": null,
			  "id": 49,
			  "person_id": 26,
			  "creator_user_id": 21180837,
			  "expected_close_date": null,
			  "owner_name": "Johan",
			  "arr_currency": null,
			  "participants_count": 1,
			  "stage_id": 2,
			  "probability": null,
			  "undone_activities_count": 0,
			  "active": true,
			  "local_lost_date": null,
			  "person_name": "Daniel Hardman",
			  "last_activity_date": null,
			  "close_time": null,
			  "org_hidden": false,
			  "next_activity_id": null,
			  "weighted_value_currency": "USD",
			  "local_won_date": null,
			  "stage_order_nr": 1,
			  "next_activity_subject": null,
			  "rotten_time": null,
			  "user_id": 21180837,
			  "visible_to": "3",
			  "org_id": 23,
			  "notes_count": 0,
			  "next_activity_time": null,
			  "channel_id": null,
			  "formatted_value": "$4,000",
			  "status": "open",
			  "formatted_weighted_value": "$4,000",
			  "mrr_currency": null,
			  "first_won_time": null,
			  "origin": "ManuallyCreated",
			  "last_outgoing_mail_time": null,
			  "origin_id": null,
			  "title": "Pearson - Hardman deal",
			  "last_activity_id": null,
			  "update_time": "2024-08-15 14:31:59",
			  "activities_count": 0,
			  "pipeline_id": 1,
			  "lost_time": null,
			  "currency": "USD",
			  "weighted_value": 4000,
			  "org_name": "Pearson - Hardman",
			  "value": 4000,
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
			  "followers_count": 1,
			  "stage_change_time": null,
			  "add_time": "2024-08-12 10:59:40",
			  "done_activities_count": 0
			},
			"retry": 0,
			"event": "updated.deal"
	
	})



	expect(res.statusCode).toBe(200)
})

