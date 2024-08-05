const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    access_token: String,
    refresh_token: String,
    expiration_date: Date
})


const userSchema = mongoose.Schema({
	pipedrive_user_name: String,
    pipedrive_user_id: String,
    pipedrive_company_id: String,
    api_domain: String,
    google_email: String,
    pipedrive_tokens: tokenSchema,
    google_tokens: tokenSchema,
    registration_date: {type:Date,default:Date.now()},
    last_login_date: Date
});

const User = mongoose.model('users', userSchema);
module.exports = User;