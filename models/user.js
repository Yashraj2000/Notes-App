var mongoose = require("mongoose");
var passportlocalmongoose = require("passport-local-mongoose");
// var bcrypt = require("bcryptjs")
var userschema = new mongoose.Schema({
    username : {type:String,require:true},
    password: {type:String, require:true},
    email : {type: String, required:true, unique:true},
    isverified: {type:Boolean, default:false},
    resetPasswordToken : String,
    resetPasswordExpires: Date,
    facebook:{
        id: {type:String, sparse:true},
        token: String,
        email:String,
        name: String
    }

})
userschema.plugin(passportlocalmongoose);

module.exports = mongoose.model("usermodel",  userschema);
