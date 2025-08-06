const mongoose = require('mongoose');
let Schema = mongoose.Schema;


// Example Mongoose schema for order section
const JobApplicationSchema = new Schema({
  jobTitle: String,
  coverLetter: String,  //path to upload file
  resume: String   //path to upload file
}, {
  timestamps: true // <-- this line adds createdAt and updatedAt
})
//createdAt -> is the exact date and time when the document was first created.
//updatedAt -> is the exact date and time when the document was last modified.


//create and export the model
let JobApplication = mongoose.model('JobApplication', JobApplicationSchema); 

module.exports = { JobApplication };