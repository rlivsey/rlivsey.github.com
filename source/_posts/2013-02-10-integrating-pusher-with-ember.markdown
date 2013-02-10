---
layout: post
title: "Integrating Pusher with Ember"
date: 2013-02-10 19:20
comments: true
categories: ember javascript
---

The Ember Router takes events from user actions and hands them off to the appropriate
Route depending on where the user is within the app.

[Pusher](http://pusher.com/) receives events from your server which your app then handles, but you might
want to do different things depending on where your user is within your app at the time the message is received.

Wouldn't it be great if we could hook these two things up together?

Here's what we're going to end up with in a route:

{% codeblock my_route.js %}
App.MyRoute = Ember.Route.extend({
  // subscribe/unsubscribe to a pusher channel
  // when we enter/exit this part of the app
  activate: function() {
    this.get("pusher").subscribe("a-channel");
  },
  deactivate: function() {
    this.get("pusher").unsuscribe("a-channel");
  },

  // handle event from pusher just like normal actions
  events: {
    aMessageFromPusher: function(data) {
      // do something here
    }
  }
});
{% endcodeblock %}

First of all, lets define a `Pusher` object which will handle subscribing and unsubscribing to channels, and dispatches
any messages we receive from Pusher to the router:

{% codeblock pusher.js %}
App.Pusher = Ember.Object.extend({
  key: null,

  init: function() {
    var _this = this;
    this.service = new Pusher(this.get("key"));

    this.service.connection.bind('connected', function() { _this.connected(); });
    this.service.bind_all(function(eventName, data) { _this.handleEvent(eventName, data); });
  },

  connected: function() {
    this.socketId = this.service.connection.socket_id;
    this.addSocketIdToXHR();
  },

  // add X-Pusher-Socket header so we can exclude the sender from their own actions
  // http://pusher.com/docs/server_api_guide/server_excluding_recipients
  addSocketIdToXHR: function() {
    var _this = this;
    Ember.$.ajaxPrefilter(function(options, originalOptions, xhr) {
      return xhr.setRequestHeader('X-Pusher-Socket', _this.socketId);
    });
  },

  subscribe: function(channel) {
    return this.service.subscribe(channel);
  },

  unsubscribe: function(channel) {
    return this.service.unsubscribe(channel);
  },

  handleEvent: function(eventName, data) {
    var router, unhandled;

    // ignore pusher internal events
    if (eventName.match(/^pusher:/)) { return; }

    router = this.get("container").lookup("router:main");
    try {
      router.send(eventName, data);
    } catch (e) {
      unhandled = e.message.match(/Nothing handled the event/);
      if (!unhandled) { throw e };
    }
  }
});
{% endcodeblock %}

Most of that is pretty straight-forward, we're just wrapping some basic Pusher functionality and listening for
any message which we get sent. Let's take a closer look at the meat of the `handleEvent` method:

{% codeblock lang:javascript %}
router = this.get("container").lookup("router:main");
try {
  router.send(eventName, data);
} catch (e) {
  unhandled = e.message.match(/Nothing handled the event/);
  if (!unhandled) { throw e };
}
{% endcodeblock %}

There's no longer a global `App.router` we can access in Ember, so we need to get the router from the `container`,
then we simply pass `send` the event and data we got from Pusher. This will then trigger
the event on the current route, or the first of its parents which handle the event.

If the event goes unhandled Ember will raise an error, normally we want this to make sure we're not
exposing functionality the current route can't handle, but in this case we have no control of where
the user is within our app when a message from Pusher.

How does our Pusher object get the container, and how do our controllers and routes get
access to Pusher? We do this with injections in an initializer:

{% codeblock lang:javascript %}
Ember.Application.initializer({
  name: "pusher",
  initialize: function(container, application) {
    // use the same instance of Pusher everywhere in the app
    container.optionsForType('pusher', { singleton: true });

    // register 'pusher:main' as our Pusher object
    container.register('pusher', 'main', application.Pusher);

    // inject the Pusher object into all controllers and routes
    container.typeInjection('controller', 'pusher', 'pusher:main');
    container.typeInjection('route', 'pusher', 'pusher:main');
  }
});
{% endcodeblock %}

Now any controller or route which is instantiated will automatically have an instance of our
Pusher object injected into it.

This causes a bit of a problem with controllers which extend from `ObjectController` as it will try
and set `pusher` on them before they have any content assigned and raise the following error:

{% codeblock %}
Cannot delegate set('pusher', pusher) to the 'content' property
of object proxy <Ember.ObjectProxy:ember420>: its 'content' is undefined
{% endcodeblock %}

To address this, we can reopen `ControllerMixin` to assign a default null value for `pusher`. As
`ObjectController` mixes in `ControllerMixin` it now has its own `pusher` property and the error is
avoided:

{% codeblock lang:javascript %}
Ember.ControllerMixin.reopen({
  pusher: null
});
{% endcodeblock %}

Now in your `app.js` or wherever you kick-off your app, we can re-open `App.Pusher` to set the API key:

{% codeblock app.js %}
App.Pusher.reopen({
  key: "your-pusher-key"
});
{% endcodeblock %}

Job done, now any messages received from Pusher will trigger events on your routes and you can handle them just
like normal user actions.