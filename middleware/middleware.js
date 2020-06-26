var notesmodel = require("../models/notes");
var commentmodel = require("../models/comment")

var midobj = {};


midobj.checkcomment= function(req, res, next)
{
    if(req.isAuthenticated())
    { 
     commentmodel.findById(req.params.cmtid, (err, data)=>{
         if(err)
         {
             req.flash("error", "Data not found");
             res.redirect("back")
         }
         else
         {   //console.log(data)
             if(data.author.id.equals(req.user._id))
               next();
             else 
             {  req.flash("error", "You dont own the content")
                console.log(err);
             }
         }
     })
    }
    else
    {   req.flash("error", "You need to log in to do that")
        res.redirect("/login");
    }
}




midobj.isloggedin= function(req, res, next){
    if(req.isAuthenticated())
      return next();
      req.flash("error", "you need to login to do that");
      res.redirect("/login");
    // else 
    // {
    //     if(req.user.isverified=="undefined" || req.user.isverified==false)
    //     {
    //         req.flash("error", "you need to verify you account");
    //         return res.redirect("/resent");
    //     }
    //     else if(!req.isAuthenticated())
    //     {
    //         req.flash("error", "you need to login to do that");
    //         res.redirect("/login");
    //     }
    // }
}
midobj.checkownership=function(req, res, next)
{

    if(req.isAuthenticated())
    {
        notesmodel.findById(req.params.id, (err, data)=>{
            if(err || !data )
            {   req.flash("error", "Data not found")
                res.redirect("/materials")
            }
            else{
                if(data.author.id.equals(req.user._id))
                next();
                else 
                res.redirect("back");
            }
     
        })
    } 
    else {
        req.flash("error", "You need to login in first")
        res.redirect("/login")
    }

}

// midobj.isverified = function(req, res, next){
//     if(req.user.isverified===false)
//     {
//         req.flash("error", "You need to register your mail id");
//         res.redirect("/resent");
//     }
//     else
//      next();
// }


module.exports = midobj;