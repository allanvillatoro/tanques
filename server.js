// modules =================================================
var express        = require('express');
var app            = express();
var mongoose       = require('mongoose');
var bodyParser     = require('body-parser');
var path     	     = require('path');
var methodOverride = require('method-override');

//autenticacion
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// configuration ===========================================

// config files
var db = require('./config/db');

//connection to db
mongoose.connect(db.url, function (error) {
    if (error) console.error(error);
    else console.log('mongo connected');
});

var port = process.env.PORT || 3000; // set our port

// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json()); // parse application/json 
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(path.join(__dirname,'public'))); // set the static files location /public/img will be /img for users
app.use(logger('dev'));
app.use(cookieParser());

// ====== PASSPORT CONFIGURATION ======
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
var Account = require('./app/models/Account'); //toma el modelo

passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// routes ==================================================
require('./app/routes/tanques')(app);
require('./app/routes/users')(app);

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname,'public','index.html'));
});

// start app ===============================================
app.listen(port);	
console.log('Magic happens on port ' + port); 			// shoutout to the user

// error hndlers
app.use(function(req, res, next) {
  /*var err = new Error('Not Found');
  err.status = 404;
  next(err);*/
  res.redirect('/');
});

app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.end(JSON.stringify({
    message: err.message,
    error: {}
  }));
});

exports = module.exports = app; 						// expose app