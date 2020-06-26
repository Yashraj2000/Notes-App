require('dotenv').config();
var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
var mongoclient = require("mongodb").mongoclient;
var methodoverride = require("method-override");
var flash = require("connect-flash");
var passport = require("passport")
var localstrategy = require("passport-local");
var fb = require("passport-facebook");
var Facebookstrategy = fb.Strategy;
var usermodel = require("./models/user");
var notesmodel = require("./models/notes") // ./ means it tells the current directory we are in 
var commentmodel = require("./models/comment")
var materialroute = require("./routes/material");
var commentroute = require("./routes/comment");
var authroute = require("./routes/auth");
var middleware = require("./middleware/middleware");
var bcrypt = require("bcryptjs");
var expresslayout = require("express-ejs-layouts");

//console.log(process.env.GMAILPW)

var expresssanitizer = require("express-sanitizer") // This helps the user to enter html tags and will filter all the script tags entered
// academics_group is the name of the database 
mongoose.connect("mongodb://127.0.0.1:27017/academics_group",{useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify:false,useCreateIndex: true });
app.set("view engine", "ejs"); // it tells express we'll render ejs files 
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.static(__dirname+ "/public")); // it tells express to look into public directory dir name tells the current directory using or not using wont have any effect
                                              // try console.log(__dirname) if confusion
                                              //console.log(__dirname);
app.use(methodoverride("_method")); // use for delete and update operations havent used anywhere in this code see blog app update/delete lecture
app.use(expresssanitizer()); // This line always comes after bodyparser, removes script tag
app.use(flash());

//Passport configuration please follow the same order
app.use(require("express-session")({
    secret: "This can be anyting",
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new localstrategy(usermodel.authenticate()));
passport.use(
    new localstrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      usermodel.findOne({email: email}).then(user => {
        if (!user) 
        {
          return done(null, false);
        }
        // Match password
        bcrypt.compare(password, user.password,(err, isMatch) => {
          if (err)
          { 
            return done(null, false)
          }
          // if(!user.isverified)
          // {//req.flash("error", "user not verified");
          // //    res.redirect("/resent")
          // middleware.isverified();
          // //return done(null, false, {message:"You need to verify your email id"})
            // }
            if (isMatch)
          {
            return done(null, user);
          } 

          else {
            return done(null, false);
          }
        });
      });
    })
  );
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    usermodel.findById(id, function(err, user) {
      done(err, user);
    });
  });

 passport.use(
   new Facebookstrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL : "/facebooklogin",
      profileFields: ["emails", "name","id"]// this field is necessary to get user email fro facebook and pass { scope : ['email'] } in passport.authenticate,
    }, 
    function(accesstoken, refreshtoken, profile, done)
    {  // nexttick is a node js async function that will wait for the data to come back then will proceed
      // If someone has declined a permission for your app, the login dialog won't let your app re-request the permission unless you pass auth_type=rerequest along with your request.
       process.nextTick(function(){
         //console.log(profile);
          usermodel.findOne({"facebook.id":profile.id},(err, user)=>{
            if(err)
            return done(err);
            if(user)
            return done(null, user);
            else 
            { usermodel.findOne({email:profile.emails[0].value}, (err,userdata)=>{
              if(userdata)
              {  console.log(userdata)
                //req.flash("error","User already registere")
                return done(null,false,{message:"Primary email already registred"})
              }
              var newuser = new usermodel();
              newuser.facebook.id = profile.id;
              newuser.isverified = true;
              newuser.facebook.name = profile.name.givenName + " " + profile.name.familyName;
              newuser.facebook.token = accesstoken; 
              profile.emails=='undefined'?undefined:newuser.email = profile.emails[0].value;
              // newuser.facebook.email = profile.emails[0].value;
              // newuser.email = profile.emails[0].value;
              newuser.username = profile.name.givenName + " " + profile.name.familyName;
              newuser.save(function(err){
                if(err)
                  throw err;
                console.log(newuser)
                return done(null, newuser);
              })
             })

            }

          })
       })
    }
   )
 )
// in order to hide login and registr once user logged in and show when user isnt logged in we have to check user data is there or not
// which is always present inside req.user by passport for that wehave to pass this as a variable to evry page and use simple if else statement
// passing on evey page would be tedious so use below code



// these are global variable
app.use(function(req, res, next){
    res.locals.currentUser = req.user; // curentuser now have valie of req.user now pass this variable inside header template
                                       // req.user will contain all the data of the user i.e name and id not passowrd 
    res.locals.e = req.flash("error"); // if there is nothing in e that is value of error is not defined it will still return true as empty array is true
                                       // so used e.length()>0 to check if there is any data or not
    res.locals.s = req.flash("success");
    next();

})
// <!-- <%  if(currentUser.id == moredata.author.id){%> if we use this code to hide or how button it will throw error when user is not logged in so there has be other approach-->
// <!-- <% if(currentUser && currentUser.id == moredata.author.id) {%> There is a other way also check that-->


app.use(authroute);
app.use(commentroute);
app.use(materialroute);





// <div class="container">
// <%  if(e && e.length>0){  %>
//   <div class="alert alert-warning alert-dismissible fade show" role="alert">
//     <%= e %>
//     <button type="button" class="close" data-dismiss="alert" aria-label="Close">
//       <span aria-hidden="true">&times;</span>
//     </button>
//   </div>
// <% }%>
// <%  if(s && s.length>0){  %>
// <div class="alert alert-warning alert-dismissible fade show" role="alert">
// <%= s %>
// <button type="button" class="close" data-dismiss="alert" aria-label="Close">
//   <span aria-hidden="true">&times;</span>
// </button>
// </div>

// <%}%>
// </div> // its was inside the header 

app.listen(8080, function(){

    console.log("server stared");
})