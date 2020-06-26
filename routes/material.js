var express = require("express");
var router  = express.Router({mergeParams:true}); // This will merge all the files id 
var notesmodel = require("../models/notes")
var middleware = require("../middleware/middleware")
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);



router.get("/materials/forms",middleware.isloggedin,(req,res)=>{
    res.render("notes/form");
})

// try adding islogged in here
router.get("/materials",middleware.isloggedin,(req,res)=>{
//res.render("materials", {content:materials});
    //console.log(req.user)
    notesmodel.find({},(err, data)=>{
      if(err)
      console.log(err);
      else
      res.render("notes/materials", {content:data});
    })
})

router.post("/materials",middleware.isloggedin,(req,res)=>{
    req.body.outcomes = req.sanitize(req.body.outcomes)
     var materialname = req.body.title;
     var imageurl = req.body.image;
     var outcome  = req.body.outcomes;
     var author = {
         id: req.user._id,
         username : req.user.username
     };
    
     geocoder.geocode(req.body.location, function(err, data){
         if(err || !data.length)
         {   console.log(err);
             req.flash("error", "Invalid address");
             return res.redirect("back");
         }

         var lat = data[0].latitude;
         var lng = data[0].longitude;
         var location = data[0].formattedAddress;
         var obj = {title:materialname, image:imageurl, outcomes:outcome, author: author, location:location, lat:lat, lng:lng};
         notesmodel.create(obj, (err, data)=>{
             if(err)
             console.log(err);
             else {
                 console.log(data);
                 res.redirect("/materials");
     
             }
         })
     })
})
 // in association populate will act upon the property which is declared as array comments in this case in it will refer to the name of collection
 // usercomments in this case
 router.get("/materials/:idd",(req,res)=>{
    notesmodel.findById(req.params.idd).populate("comments").exec((err, data)=>{
        if(err || !data)
        {
            console.log(err);
            req.flash("error", "Data not found");
            res.redirect("back");
        }
        else
        console.log(data);
        res.render("notes/moreinfo",{moredata:data})
    })
})





router.get("/materials/:id/edit",middleware.checkownership,(req, res)=>{
       
    notesmodel.findById(req.params.id, (err,data)=>{
        if(err)
        res.redirect("/materials");
        else 
        res.render("edit", {editdata:data});
    })

})

router.post("/materials/:id/update",middleware.checkownership,(req,res)=>{
    req.body.data.outcomes = req.sanitize(req.body.data.outcomes);
    geocoder.geocode(req.body.data.location, function(err, data){
        if(err || !data.length)
        {
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        req.body.data.lat = data[0].latitude;
        req.body.data.lng = data[0].longitude;
        req.body.data.location = data[0].formattedAddress;
        console.log("-------------------------------")
        console.log(req.body.data);
        notesmodel.findByIdAndUpdate(req.params.id, req.body.data, (err, updateddata)=>{
            if(err)
            console.log(err);
            else {
            res.redirect("/materials/"+req.params.id)
            console.log(updateddata)
            }
        })
    })

})


router.post("/deletes/:id",middleware.checkownership, (req,res)=>{

notesmodel.findByIdAndRemove(req.params.id, (err, data)=>{
    if(err)
    console.log(err);
    else
    res.redirect("/materials")
})
})

//middele ware 




module.exports = router;
