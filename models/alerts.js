const mongoose = require('mongoose');


const alertSchema = mongoose.Schema({
    alert_name: String,
	pipedrive_webhook_id: String,
    google_channel_id: String,
    google_channel_name: String,
    user_id : {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    trigger_id : {type: mongoose.Schema.Types.ObjectId, ref: 'triggers'},
    creation_date : {type:Date,default:Date.now()},
    last_update_date: Date,
    message : String,
});

const Alert = mongoose.model('alerts', alertSchema);
module.exports = Alert;