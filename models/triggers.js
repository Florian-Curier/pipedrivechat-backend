const mongoose = require('mongoose');


const triggerSchema = mongoose.Schema({
	trigger_name: String,
    default_message: String,
    labels: [String]
});

const Trigger = mongoose.model('triggers', triggerSchema);
module.exports = Trigger;