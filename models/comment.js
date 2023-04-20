const mongoose = require('mongoose');

commentSchema = new mongoose.Schema({

name: {type: String, required:true},
comment: {type: String, required:true},
pfp:{type:String, required:true}

});


const Comment = mongoose.model('Comment',commentSchema);

module.exports = Comment;