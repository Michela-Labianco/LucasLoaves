const mongoose = require('mongoose');
let Schema = mongoose.Schema;


// Example Mongoose schema for contact section
const contactSchema = new Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

//create and export the model
let Contact = mongoose.model('Contact', contactSchema); 

module.exports = {Contact};