const mongoose = require('mongoose');


const messageSchema = mongoose.Schema({
    message_text: String,
    alert_id : {type: mongoose.Schema.Types.ObjectId, ref: 'alerts'},
    pipedrive_event: Object,
    google_response_status: Number,
    google_response_details: Object,
    creation_date : {type:Date,default:Date.now()},
    interactions: Number,


});

const Message = mongoose.model('messages', messageSchema);
module.exports = Message;