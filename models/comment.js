var mongoose  = require("mongoose");

var commnetschema = new mongoose.Schema({
    author: {
     id:
     { 
        type: mongoose.Schema.Types.ObjectId,
        ref : "usermodel"
     },
     username: String
    },
    comment: String
})

module.exports = mongoose.model("userscomment", commnetschema); 
 // userscomment is the singular name of the model whose plural will act as collections
 // in association populate will act upon the property which is declared as array comments in this case in it will refer to the name of collection
 // userscomment in this case