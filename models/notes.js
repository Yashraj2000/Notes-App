var mongoose = require("mongoose");
var notesschema = new mongoose.Schema({
    title : String,
    image : String,
    outcomes:String,
    created : {type : Date, default: Date.now},
    location: String,
    lat : Number,
    lng : Number,
    comments : [ 
      {
        type: mongoose.Schema.Types.ObjectID,
        ref : "userscomment"  // It should be the name of model not the file you are exporting else it will show the error schema hasnt been registered for it
      }
    ] ,
    author: {
      id:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "usermodel"
        },
      username : String
    }
 }) 
 // enginerring is the name of collection
 var notesmodel = mongoose.model("engineering", notesschema);

 module.exports = notesmodel;