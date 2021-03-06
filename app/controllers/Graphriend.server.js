'use strict';

var moment = require('moment');
var Users = require('../models/users.js');
var sess;

function Graphriend () {

  // Sign Up
  this.signUp = function(req, res) {
		sess = req.session;
		if (!req.body.name) {
			res.json({error: true, message: 'What is your name?'});
		} else if (!req.body.username) {
			res.json({error: true, message: 'Username is necessary'});
		} else if (!req.body.password) {
			res.json({error: true, message: 'Password its empty, fill this'});
		} else {
			// var user = { 'name': req.body.name, 'email': req.body.username, 'password': req.body.password, 'date': new Date() };
			Users.findOne({ 'username': req.body.username }, function(err, doc) {
				if (err) throw err;
      	if (doc) {
					// User is registered
					res.json({error: true, message: 'Friend registered with this username'});
				} else {
					// Save new user
					var user = new Users({
						'name': req.body.name,
						'username': req.body.username,
					  'password': req.body.password,
					  'date': new Date()
					});
					user.save(function(err, doc) {
        		if(err) throw err;
            sess.user = doc;
        		res.json(doc);
      		});
				};
			});
		};
  };

  // Log In
  this.logIn = function(req, res) {
		sess = req.session;
		if (!req.body.username) {
			res.json({error: true, message: 'What is your username?'});
		} else if (!req.body.password) {
			res.json({error: true, message: 'Password its empty, fill this'});
		} else {
			Users.findOne({ 'username': req.body.username, 'password': req.body.password }, function(err, doc) {
				if (err) throw err;
				if (doc) {
					sess.user = doc;
					res.json(doc);
				} else {
					res.json({error: true, message: 'Email/Password incorrect, try again!'});
				}
			});
		};
	};

  // Logout
  this.logOut = function(req, res) {
		sess = req.session;
		req.session.destroy();
		res.json({logout: true});
	};

  // Show All friends
  this.showAll = function(req, res) {
    sess = req.session;
    Users.findOne({ _id: sess.user._id }, { __v: false }, function(err, user) {
      if (err) throw err;
      Users
      .find({}, { __v: false })
      .sort({'date': -1})
      .exec(function(err, users) {
        res.render('main', { user: sess.user, users: filterFriends(user, users), page: 'all', fromNow: fromNow });
      });
   });
  };

  // Show My friends
  this.showMy = function(req, res) {
    sess = req.session;
    Users.findOne({ _id: sess.user._id }, { __v: false }, function(err, user) {
      if (err) throw err;
      Users
      .find({ username: { $in: user.friends } }, { __v: false })
      .sort({'date': -1})
      .exec(function(err, friends) {
        res.render('main', { user: sess.user, friends: friends, page: 'my', fromNow: fromNow });
       });
    });
  };

  // Get friends
  this.getFriend = function(req, res) {
    sess = req.session;
    var friend = req.params.username;
    Users.findOne({ 'username': friend  }, function(err, user) {
      if (err) throw err;
      Users
      .find({ username: { $in: user.friends } }, { __v: false })
      .sort({'date': -1})
      .exec(function(err, friends) {
        if (err) throw err;
        res.json(getNodes(user, friends));
      });
    });
  };

  // Add friend
  this.addFriend = function(req, res) {
    sess = req.session;
    var friend = req.params.username;
    Users.findOne({ '_id': sess.user._id  }, function(err, user) {
      if (err) throw err;
      var pos = user.friends.indexOf(friend);
      if (pos < 0) {
        user.friends.push(friend);
        user.save();
      }
      res.json({ id: user._id, friend: friend, friends: user.friends.length });
    });
  };

  // Delete friend
  this.delFriend = function(req, res) {
		sess = req.session;
    var friend = req.params.username;
		Users.findOne({ '_id': sess.user._id }, function(err, user) {
    	if (err) throw err;
      var pos = user.friends.indexOf(friend);
			if (pos >= 0) {
        user.friends.splice(pos, 1);
        user.save();
			}
      res.json({ id: user._id, username: friend, friends: user.friends.length });
    });
	}

  // Get nodes
  var getNodes = function(user, friends) {
    var nodes = [{
      id: user.username,
      label: user.name,
      shape: 'circularImage',
      image: '//api.adorable.io/avatar/100/' + user.username
    }];
    var edges = [];
    friends.forEach(function(friend) {
      nodes.push({
        id: friend.username,
        label: friend.name,
        shape: 'circularImage',
        image: '//api.adorable.io/avatar/100/' + friend.username
      });
      edges.push({from: user.username, to: friend.username});
    });
    return {nodes: nodes, edges: edges};
  };

  // Filter Helper
  function filterFriends(user, friends) {
    friends.forEach(function(friend) {
      var pos = user.friends.indexOf(friend.username);
      if (pos < 0) {
        friend.isFriend = false;
      } else {
        friend.isFriend = true;
      }
    });
    return friends;
  }

  // Moment Helper
  function fromNow(date){
	  return moment(date).fromNow()
	}

}

module.exports = Graphriend;
