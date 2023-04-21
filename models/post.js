//const User = require('./user');
const Comment = require('./comment');
const mongoose = require('mongoose');


PostSchema = new mongoose.Schema({

title: {type:String, required:true},
summary: {type:String, required:true},
content: {type:String, required:true},
cover:{type:String, required:true},
category:{type:String,required:true},
author:{type:mongoose.Schema.Types.ObjectID, ref:()=>User},
comments:[{type:mongoose.Schema.Types.ObjectID,ref:Comment}]
},{timestamps: true});


const Post = mongoose.model('Post',PostSchema);


const UserSchema = new mongoose.Schema({

fName: {type:String, required:true, min:4},
lName: {type:String, required:true},
gender: {type:String, required:true},
age:{type:Number, required:true},
email: {type:String, required:true},
username: {type:String, required:true,unique:true},
password:{type:String, required:true},
pfp:String,
createdOn: {type:Date, default: Date.now},
saved: [{type: mongoose.Schema.Types.ObjectID, ref:()=>Post}]


});

const User = mongoose.model('user', UserSchema);



module.exports = {User, Post};


