var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    flash = require("connect-flash"),
    mongoose = require('mongoose'),
    methodOverride = require('method-override'),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    Blog = require('./models/blog.js'),
    Comment = require('./models/comment.js'),
    User = require('./models/user.js'),
    seedDB = require('./seeds.js');
mongoose.connect("mongodb://localhost/restful_blog_app", {useNewUrlParser: true , useUnifiedTopology: true}
        );
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());

//seedDB();

//passport configuration
app.use(require('express-session')({
  secret: "Lionel messi is the greatest ever",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// passing the user infor in every route
app.use(function(req,res,next){
  res.locals.user = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");

  next();
});

app.get('/',(req,res)=>{
  res.render("home.ejs");
});

//RESTful routes
app.get("/blog",(req,res)=>{
  Blog.find({},(err,blogs)=>{
    if(err){
      console.log(err);
    } else {
        res.render("blogs/index",{blogs:blogs});
    }
  })
});
// NEW route
app.get('/blog/new',isLoggedIn,(req,res)=>{
  res.render('blogs/new');
});

app.post('/blog',isLoggedIn,(req,res)=>{
  //create blog in db
  Blog.create(req.body.blog,function(err,newBlog){
    if(err){
      res.render('blogs/new');
    } else {
      newBlog.author.id = req.user._id;
      newBlog.author.username = req.user.username;
      newBlog.save();
        req.flash("success","Successfully created a new Blog");
      res.redirect('blog');
    }
  })
});
//show route
app.get('/blog/:id',function(req,res){
  var id = req.params.id;
  Blog.findById(id).populate("comments").exec(function(err,blog){
    if(err){
    res.redirect('/blog');
    } else {
      res.render('blogs/show',{blog:blog});
    }
  })
});

// comment routes

app.get('/blog/:id/comments/new',isLoggedIn,function(req,res){
    var id = req.params.id;
    Blog.findById(id,function(err,blog){
      if(err){
        res.redirect('/blog');
      } else {
        res.render('comments/new',{blog:blog});
      }
})
});

app.post('/blog/:id/comments',isLoggedIn,function(req,res){
    var id = req.params.id;
    Blog.findById(id,function(err,blog){
      if(err){
        res.redirect('/blog');
      } else {
        Comment.create(req.body.comment,function(err,comment){
          if(err){
            console.log(err);
          } else {
                comment.author.id = req.user._id;
                comment.author.username = req.user.username;
                comment.save();
                blog.comments.push(comment);
                blog.save();
      //            req.flash("success","Successfully added a new comment");
                res.redirect('/blog/'+id);
              }
            })
        }})
});

// comment edit route

app.get('/blog/:id/comments/:comment_id/edit',isAuthorizedComment,function(req,res){
  var comment_id = req.params.comment_id;
  Comment.findById(comment_id,function(err,comment){
    if(err){
      console.log(err);
    } else {
        res.render("comments/edit", {comment:comment,blog_id:req.params.id});
    }
  });
});

// Comment edit data handling put request route
app.put('/blog/:id/comments/:comment_id',isAuthorizedComment,function(req,res){
  var comment_id = req.params.comment_id;
  Comment.findByIdAndUpdate(comment_id,req.body.comment,function(err,comment){
    if(err){
      console.log(err);
    } else {
    //    req.flash("success","Successfully edited the comment");
        res.redirect('/blog/'+req.params.id);
    }
  });
});

// Comment delete route

app.delete('/blog/:id/comments/:comment_id',isAuthorizedComment,function(req,res){
  Comment.findByIdAndRemove(req.params.comment_id,function(err){
    if(err){
      res.redirect('/blog/'+req.params.id);
    } else {
      req.flash("success","Successfully deleted the comment");
      res.redirect('/blog/'+req.params.id);
    }
  })
});

// Blog EDIT route

app.get('/blog/:id/edit', isAuthorized,function(req,res){
  var id = req.params.id;
  Blog.findById(id,function(err,blog){
  res.render('blogs/edit',{blog:blog});
  })
});

// UPDATE route

app.put('/blog/:id',isAuthorized,function(req,res){
  var id = req.params.id;
  Blog.findByIdAndUpdate(id,req.body.blog,function(err,blog){
    if(err){
      res.redirect('/blog');
    } else {
      //  req.flash("success","Successfully edited the Blog");
      res.redirect(`/blog/${id}`);
    }
  })
})

//DELETE route

app.delete('/blog/:id',isAuthorized,function(req,res){
  //destroy blog
  Blog.findByIdAndRemove(req.params.id,function(err){
    if(err){
      res.redirect('/blog');
    } else {
      req.flash("success","Successfully deleted the Blog");
      res.redirect('/blog');
    }
  })
});

// Auth routes

// Get the register form page
app.get('/register',function(req,res){
  res.render("register");
});

// Handle the data from the register form page
app.post('/register',function(req,res){
  var newUser = new User({
    username: req.body.username,
  })

  User.register(newUser,req.body.password,function(err,user){
    if(err){
      req.flash("error",err.message);
      return res.render("register");
    } else {
      passport.authenticate("local")(req,res,function(){
        req.flash("success","Welcome to Extra Time " +user.username);
        res.redirect("/blog");
      })
    }
  })
});

// show login form
app.get('/login',function(req,res){
  res.render("login");
});

// handle the login data
app.post('/login',passport.authenticate("local",{
    successRedirect: "/blog",
    failureRedirect: "/login"
}),function(req,res){
});

// logout route

app.get('/logout',function(req,res){
  req.logout();
  req.flash("success","Logged Out Successfully");
  res.redirect("/blog");
});

// Middleware to check whether the user is logged in
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  req.flash("error","You need to be logged in to do that");
  res.redirect("/login");
}

// Middleware to check the authorization of the user to edit or delete blog
function isAuthorized(req,res,next){
  if(req.isAuthenticated()){
    Blog.findById(req.params.id,function(err,blog){
      if(err){
        res.redirect("back");
      } else {
        if(blog.author.id.equals(req.user._id)){
          next();
        } else {
        req.flash("error","You are not authorized to do that");
        res.redirect("back");
        }
      }
    });
  } else {
      req.flash("error","You need to be logged in to do that");
    res.redirect("back");
  }
}

// Middleware to check the authorization of the user to edit or delete comments
function isAuthorizedComment(req,res,next){
  if(req.isAuthenticated()){
    Comment.findById(req.params.comment_id,function(err,comment){
      if(err){
        res.redirect("back");
      } else {
        if(comment.author.id.equals(req.user._id)){
          next();
        } else {
        res.redirect("back");
        }
      }
    });
  } else {
    res.redirect("back");
  }
}

app.listen("2000",()=>{
  console.log("blog server started");
})
