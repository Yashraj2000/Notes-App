var express = require("express");
var router  = express.Router({mergeParams:true}); // This will merge all the files id 
var notesmodel = require("../models/notes");
var commentmodel = require("../models/comment");
var middleware = require("../middleware/middleware")


router.get("/materials/:id/commentform", middleware.isloggedin, (req, res)=>{
    notesmodel.findById(req.params.id, (err, data)=>{
          if(err)
          console.log(err);
          else 
          res.render("comments/commentform", {cmtdata:data})
    })
})
router.post("/commentdata/:id",middleware.isloggedin, (req, res)=>{
   notesmodel.findById(req.params.id, (err, data)=>{
       if(err)
       console.log(err);
       else
       {  //console.log(data)
           commentmodel.create(req.body.cmt, (err, cmtdata)=>{
               if(err)
               console.log(err);
               else
               {   //console.log(cmtdata);
                   // here we have associated comment with user name , saving is necessary unless changes wont be reflected
                   cmtdata.author.id = req.user._id;
                   cmtdata.author.username = req.user.username;
                   cmtdata.save();
                   //console.log(cmtdata)
                   data.comments.push(cmtdata);
                   //console.log(data)
                   data.save();
                   //console.log(cmtdata);   
                   res.redirect("/materials/" + req.params.id)
              }
           })
       } 
   })
})

 
router.get("/materials/:id/editcmt/:cmtid/newcomment",middleware.checkcomment, (req, res)=>{
   notesmodel.findById(req.params.id, (err, data)=>{
       if(err || !data)
       {
           req.flash("error", "data not found");
           res.redirect("back");
       }
       else 
       {       //console.log(data);
               commentmodel.findById(req.params.cmtid, (err, edit_comment)=>{
               if(err)
               console.log(err);
               else{ 
                res.render("editcomment",{notesdata:data,edits:edit_comment})
               //console.log(editcomment)
               }
           })
       }
   })

})

router.put("/materials/:id/editcmt/:cmtid",middleware.checkcomment, (req, res)=>{
                commentmodel.findByIdAndUpdate(req.params.cmtid, req.body.value, (err, newdata)=>{
                console.log(req.body.value)
                if(err)
                console.log(err);
                else
                res.redirect("/materials/" + req.params.id);    
            })
 })

router.post("/materials/:id/delete/:cmtid",middleware.checkcomment, (req,res)=>{
       commentmodel.findByIdAndRemove(req.params.cmtid, (err,data)=>{
           if(err)
           console.log(err)
           else 
           res.redirect("/materials/"+req.params.id)
       })
})


//middle ware

// function isloggedin(req, res, next){
//     if(req.isAuthenticated())
//       return next();
//     else 
//       res.redirect("/login")
// }


// function checkcomment(req, res, next)
// {
//     if(req.isAuthenticated())
//     { 
//      commentmodel.findById(req.params.cmtid, (err, data)=>{
//          if(err)
//          console.log(err);
//          else
//          {   console.log(data)
//              if(data.author.id.equals(req.user._id))
//                next();
//              else 
//               console.log(err);
//          }
//      })
//     }
//     else
//     res.redirect("/login");
// }


module.exports = router;