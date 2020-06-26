var mongoose = require("mongoose");

var tokenschema = new mongoose.Schema({
   
    userid:{type:mongoose.Schema.Types.ObjectId, required:true, ref:"usermodel"},
    token:{type:String, required:true},
    createdat:{type:Date, required:true, default:Date.now, expires:4300}


});

module.exports = mongoose.model("tokenmodel",tokenschema)