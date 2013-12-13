---
layout: post
title: "Introducing Fireplace"
date: 2013-12-13 21:33
comments: true
categories: firebase ember javascript fireplace
---

I've been using [Firebase](http://firebase.com) with [Ember.js](http://emberjs.com) quite a lot recently and have just
released [Fireplace](http://github.com/rlivsey/fireplace), a library to integrate the two more easily. It's been
extracted from a rather large application so is driven from real world usage.

There's [EmberFire](https://github.com/firebase/emberFire) but, aside from it not existing when I started to write Fireplace,
it doesn't support relationships or many other basic / advanced features I'd want in an Ember persistence library.

Anyone who's used [Ember Model](https://github.com/ebryn/ember-model) or [Ember Data](https://github.com/emberjs/data)
should feel at home with Fireplace as I've taken inspiration (and code) from many parts of them when developing it.

```javascript
var attr    = FP.attr,
    hasMany = FP.hasMany;

App.Person = FP.Model.extend({
  firstName:   attr(),
  lastName:    attr(),
  dateOfBirth: attr("date"),
  isAdmin:     attr("boolean", {default: false}),
  addresses:   hasMany()
});

App.Address = FP.Model.extend({
  street:   attr(),
  city:     attr(),
  postcode: attr()
});
```

Fireplace has full support for promises, so fits in nicely with Ember's router:

```javascript
App.PeopleIndexRoute = Ember.Route.extend({
  model: function() {
    return this.store.fetch("person", {limit: 10});
  }
});

App.PeopleShowRoute = Ember.Route.extend({
  model: function(params) {
    return this.store.fetch("person", params.person_id);
  }
})
```

Check out the [project on Github](http://github.com/rlivsey/fireplace) for more details.

Feedback & pull requests are very welcome!