
module.exports = function(app) {

var passport = require('passport');
var Account = require('../models/Account');

app.post('/register', function(req, res) {
	Account.register(new Account({ username: req.body.username }), req.body.password, function(err, account) {
		if (err) {
			return res.status(500).json({err: err});
		}
		passport.authenticate('local')(req, res, function () {
			return res.status(200).json({status: 'Registration successful!'});
		});
	});
});

app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
      res.status(200).json({
        status: 'Login successful!'
      });
    });
  })(req, res, next);
});

app.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Hasta luego.'
  });
});

app.get('/user', function (req, res) {
    res.status(200).json({ user : req.user });
});

app.get('/status', function(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      status: false
    });
  }
  res.status(200).json({
    status: true
  });
});

};