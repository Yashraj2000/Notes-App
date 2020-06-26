var fb = require("passport-facebook");
var Facebookstratey = fb.Strategy; 
var express = require("express");
var router  = express.Router({mergeParams:true}); // This will merge all the files id 
var notesmodel = require("../models/notes");
var tokenmodel = require("../models/token");
var usermodel = require("../models/user");
var passport  = require("passport")
var middleware = require("../middleware/middleware") // NOt used anywhere in this page
var async = require("async");
var nodemailer = require("nodemailer");
var crypto  = require("crypto");
var bcrypt  = require("bcryptjs")
//:aa means we made it a variable i.e after /yash/....jrinfe  whatever comes it will accept and process the code accordingly;
// to get the value of url after : use req.params as every data is strored in request

// app.get("/yash/:aa", function(req, res){
//     var valofaa = req.params.aa;
//     res.send("welcome to " + valofaa);
// })

router.get("/", (req,res)=>{
    res.render("landing");
})


router.get("/register", (req,res)=>{
    res.render("register");
})

router.post("/register", (req,res)=>{
    var errors = [];
    if( (!req.body.name || !req.body.email) || (!req.body.password || !req.body.password2))
         {
          errors.push({msg: "Please enter all the fields"});
         }
    if(req.body.password != req.body.password2)
       errors.push({msg: "Password dont match"});
    if(req.body.password.length < 6)
       errors.push({msg: "Password must be 6 digit long"});
    if(errors.length > 0)
      res.render("register",{err: errors, name: req.body.name, email: req.body.email, password:req.body.password, password2:req.body.password2})
         
    // else
    // {
    //   //  var newuser = new usermodel({username:req.body.name,email:req.body.email});
    //   // usermodel.register(newuser, req.body.password, (err, user)=>{
    //   //     if(err)
    //   //     {
    //   //         req.flash("error", err.message);
    //   //         res.redirect("/register")
    //   //     }
    //   //     else 
    //   //     {
    //   //             passport.authenticate("local")(req, res, function(){
    //   //             req.flash("success", "welcome to notes " + newuser.username)
    //   //             res.redirect("/materials")
    //   //         });
    //   //     }
    //   // });
    // }

    else {
      usermodel.findOne({ email: req.body.email }).then(user => {
        if (user)
         {
          errors.push({ msg: 'Email already exists' });
          res.render('register', {err :errors,name: req.body.name,email: req.body.email,});
        } 
        else {
          var newUser = new usermodel({
            username: req.body.name,
            email: req.body.email,
            password: req.body.password
          });
  
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser.save()
              .then(user => {
                // req.flash('success','You are now registered and can log in' );
                // res.redirect('/login');
                console.log(user);
                var token = new tokenmodel({userid:user._id, token: crypto.randomBytes(16).toString("hex")});
              token.save()
              .then(newtoken=>{
                if(err){console.log(err)};
                var transporter = nodemailer.createTransport(
                  {service:'Gmail',
                   auth:{
                     user:"bankaraj00@gmail.com",
                     pass:process.env.GMAILPW
                   }
                  })
                 var mailOptions={
                   from:"bankaraj00@gmail.com",
                   to:user.email,
                   subject:"Account verification token",
                   text:"Hello,\n\n" + "please verify your account by clicking the link: http://" + req.headers.host + "/confirmation/" + newtoken.token +".\n"
                 }
 
                 transporter.sendMail(mailOptions, function(err) {
                   console.log('mail sent');
                   req.flash("success","Email with further instructions has been sent to " + user.email)
                   res.redirect("/resent");
                 });
              })
              })
              .catch(err => console.log(err));
            });
          });

        }
      });
    }
});


router.get("/login", (req, res)=>{
    res.render("login");
})

 router.post("/login",function(req,res){
   signIn(req,res);
 });
// router.post("/login", passport.authenticate( "local", 
// {
//     failureRedirect: "/login",
//     failureFlash:true,
// }),(req,res)=>{
//    req.flash("success", "Welcome " + req.user.username);
//    res.redirect("/materials")
// });

// router.post("/login", passport.authenticate("local", function(err, user,info){
//   if(err)
//   {
//     res
//   }
// }))


router.get("/logout", (req,res)=>{
    req.logout();
    req.flash("success", "logged you out")
    res.redirect("/login")
})
router.get("/login/facebook", passport.authenticate("facebook", { scope : ['email'] }));

router.get("/facebooklogin",passport.authenticate("facebook",{
  failureRedirect:"/login",
  failureFlash: true
}), (req,res)=>{
  req.flash("success", "Welcome" + req.user.username);
  res.redirect("/materials")
})

// confirmation email routes
router.get("/confirmation/:id", function(req, res){
  res.render("confirmation",{tokenvalue:req.params.id})
})

router.post("/confirmation", function(req, res){
console.log(req.body.token)
tokenmodel.findOne({token:req.body.token}, function(err, token){
  if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

  usermodel.findOne({_id:token.userid, email:req.body.email}, function(err,user){
   if(!user)
   {
     req.flash("error","User with this email id doesnot exists");
     return res.redirect("/confirmation");
   }
   if (usermodel.isverified) return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });
   user.isverified = true;
   user.save()
   .then(user=>{
    // if (err) { return res.status(500).send({ msg: err.message }); }
    // // res.status(200).send("The account has been verified. Please log in.");
    req.flash("success","Your account has been verified please login ");
    res.redirect("/login") // res.redirect / materials
   })
   .catch(err => console.log(err))

  })
})
});
router.get("/resent", function(req,res){
  res.render("resendtoken")
})
router.post("/resent",function(req, res){
  usermodel.findOne({email:req.body.email}, function(err,user){
   if(!user)
   {
     req.flash("error", "No such user exists");
     return res.redirect("/resent");
   }
   if(user.isverified)
   {
     req.flash("success","User already verified please login to continue");
     return res.redirect("/login");
   }
   var token = new tokenmodel({userid:user._id, token: crypto.randomBytes(16).toString("hex")});
   token.save()
   .then(newtoken=>{
     if(err){console.log(err)};
     var transporter = nodemailer.createTransport(
       {service:'Gmail',
        auth:{
          user:"bankaraj00@gmail.com",
          pass:process.env.GMAILPW
        }
       })
      var mailOptions={
        from:"bankaraj00@gmail.com",
        to:user.email,
        subject:"Account verification token",
        text:"Hello,\n\n" + "please verify your account by clicking the link: http://" + req.headers.host + "/confirmation/" + newtoken.token +".\n"
      }

      transporter.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash("success","Email with further instructions has been sent to" + user.email)
        //res.status(200).send('A verification email has been sent to ' + user.email + '.');
       //  Console.log("token while saving");
       //  console.log(newtoken.token);
        res.redirect("/resent");
      });
   })
  })
  
})





// forgot
router.get("/forgot", function(req, res) {
    res.render("reset");
  });
  
  router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        usermodel.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
            console.log(token)
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'bankaraj00@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'bankaraj00@gmail.com',
          subject: 'Node.js Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });
  //console.log(token)
  router.get('/reset/:token', function(req, res) {
    usermodel.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      console.log(user)
      res.render('update', {token: req.params.token});
    });
  });
  
  router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        usermodel.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          console.log("mdknjhb")
          console.log(req.body.password)

          if(req.body.password === req.body.confirm) 
          {
                bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(req.body.password, salt, (err, hash) => {
                  if (err) throw err;
                  user.password = hash;
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;
                  user.save()
                  .then(user => {
                     req.logIn(user, function(err){
                       done(err,user);
                     })
                  })
                  .catch(err => console.log(err));
              });
                });
          }
          
          else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'bankaraj00@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'bankaraj00@mail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/materials');
    });
  });
  
  function signIn(req, res) {
    passport.authenticate("local", 
      function afterAuthentication(err, partner,info){
        console.log(partner)
        if(err) console.log("asdfrgth")
        if(!partner) 
        {  console.log(info)
          req.flash("error","Email or password incorrect")
          res.redirect("/login")
        }
        if(partner.isverified===false)
        {
          req.flash('error',"you need to verify your email")
          res.redirect("/resent");
        }
        /** Verfied user */
      else 
      { req.logIn(partner,function(err){
        if(err)
        console.log(err);
        else
        {
          req.flash("success","Welcome " + partner.username);
          res.redirect("/materials")
        }
        })
      }
     }

    )(req,res);
}

module.exports = router;
