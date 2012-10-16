---
layout: post
title: "Writing a helper to check permissions in Ember.js"
date: 2012-10-16 14:41
comments: true
categories: ember javascript
---

## Background

Lets say we're writing a blog which allows users to login, but only certain users can write and edit articles.
We want to display add/edit buttons based on permissions, so how do we do that?

For simple permissions, this is quite trivial. For example, to check if the current logged in user is an
administrator we can just do something like:

{% codeblock blog/index.handlebars lang:html %}{% raw %}
  {{#if App.currentUser.isAdmin}}
    <button {{action newBlogPost}}>New Post</button>
  {{/if}}
{% endraw %}{% endcodeblock %}

This only works if we have a single property and we can't pass any arguments, which means the following won't work:

{% codeblock blog/index.handlebars lang:html %}{% raw %}
  {{#if App.currentUser.canEditPost post }}
    <button {{action editPost post}}>edit</button>
  {{/if}}
{% endraw %}{% endcodeblock %}


## Research

What we want is a version of `if` which knows about permissions and will let us pass in arguments so that we can end up with something like this:

{% codeblock blog/index.handlebars lang:html %}{% raw %}
  {{#can createPost}}
    <button {{action newBlogPost}}>New Post</button>
  {{else}}
    You don't have permission to post
  {{/can}}

  {{#each post in controller}}
    <a {{action viewPost post href=true}}>{{post.title}}</a>
    {{#can editPost post}}
      <button {{action editPost post}}>Edit</button>
    {{/can}}
  {{/each}}
{% endraw %}{% endcodeblock %}

Let's take a look at [from the source](https://github.com/emberjs/ember.js/blob/bbb6f5f0bd7d9f6f1951fc2306f09b4be3fcfb7d/packages/ember-handlebars/lib/helpers/binding.js#L217)
and see how `if` works:

{% codeblock ember-handlebars/lib/helpers/binding.js %}
EmberHandlebars.registerHelper('if', function(context, options) {
  Ember.assert("You must pass exactly one argument to the if helper", arguments.length === 2);
  Ember.assert("You must pass a block to the if helper", options.fn && options.fn !== Handlebars.VM.noop);

  return helpers.boundIf.call(options.contexts[0], context, options);
});
{% endcodeblock %}

This just does some sanity checking and hands off to [`boundIf`](https://github.com/emberjs/ember.js/blob/bbb6f5f0bd7d9f6f1951fc2306f09b4be3fcfb7d/packages/ember-handlebars/lib/helpers/binding.js#L151):

{% codeblock ember-handlebars/lib/helpers/binding.js %}
EmberHandlebars.registerHelper('boundIf', function(property, fn) {
  var context = (fn.contexts && fn.contexts[0]) || this;
  var func = function(result) {
    if (Ember.typeOf(result) === 'array') {
      return get(result, 'length') !== 0;
    } else {
      return !!result;
    }
  };

  return bind.call(context, property, fn, true, func, func);
});
{% endcodeblock %}

This in turn calls `bind` which handles setting up all the observers and re-rendering when properties change. The result of the `func` it builds
determines whether to display the content or not.

It looks like if we create a helper which calls `boundIf` with some property to observe on an object, it will take care of the rest for us.

{% codeblock can-helper.js %}
Handlebars.registerHelper('can', function(permissionName, property, options){

  // do magic here

  Ember.Handlebars.helpers.boundIf.call(someObject, "someProperty", options)
})
{% endcodeblock %}

Lets fake out the magic and see what happens:

{% codeblock can-helper.js %}
Handlebars.registerHelper('can', function(permissionName, property, options){

  var permission = Ember.Object.create({
    can: function(){
      return true;
    }.property()
  });

  Ember.Handlebars.helpers.boundIf.call(permission, "can", options)
})
{% endcodeblock %}

Hmm, that leaves the content as hidden. It seems that it's not calling the `can` on our permission.

If we look back at `boundIf` then we can see that it's looking up the context on the options and only falls back to `this` if
there's not one set:

{% codeblock ember-handlebars/lib/helpers/binding.js %}
  var context = (fn.contexts && fn.contexts[0]) || this;
{% endcodeblock %}

We can get around this by nuking the contexts on the options we pass through to `boundIf`.
(I'm not sure if this will cause issues, but it worked for me... YMMV and all that).

{% codeblock can-helper.js %}
Handlebars.registerHelper('can', function(permissionName, property, options){

  var permission = Ember.Object.create({
    can: function(){
      return true;
    }.property()
  });

  // wipe out contexts so boundIf uses `this` (the permission) as the context
  options.contexts = null;

  Ember.Handlebars.helpers.boundIf.call(permission, "can", options)
})
{% endcodeblock %}

If you twiddle the result of `can` from `true` to `false` then we see our content disappear and re-appear, success!

## Implementation

Lets define a class to represent our actual permission:

{% codeblock lang:javascript %}
  App.Permission = Ember.Object.extend({
    content: null,
    currentUserBinding: "App.currentUser"
  });

  App.CanCreatePost = App.Permission.extend({
    can: function(){
      return this.get("currentUser.isAdmin");
    }.property("currentUser.isAdmin")
  });
{% endcodeblock %}

We want to refer to this with a more friendly name in our templates, we could figure out that `createPost` maps to `App.CanCreatePost` by
capitalizing and prepending with 'Can', but instead lets make a simple registry:

{% codeblock lang:javascript %}
  App.Permissions = {
    _perms:    {},
    register: function(name, klass) { this._perms[name] = klass; },
    get:      function(name, attrs) { return this._perms[name].create(attrs); },
    can:      function(name, attrs) { return this.get(name, attrs).get("can"); }
  }
{% endcodeblock %}

This lets us register new permissions anywhere and assigns a friendly name which we can use throughout our app.

{% codeblock blog/permissions.js %}
  App.Permissions.register("createPost", App.Permission.extend({
    can: function() {
      return this.get("currentUser.isAdmin");
    }.property("currentUser.isAdmin")
  }));

  App.Permissions.register("editPost", App.Permission.extend({
    can: function(){
      return this.get("currentUser.isAdmin") || this.get("content.author.id") == this.get("currentUser.id");
    }.property("currentUser.isAdmin", "content")
  }));
{% endcodeblock %}

We now have a couple of permissions which have a `can` property we can bind to and friendly names to lookup from the templates.
All our helper needs to do is take the passed in name, create an appropriate permission with any attributes and pass that off
to the `boundIf` helper.

After bit of trial and error, I ended up with the following:

{% codeblock can-helper.js %}{% raw %}
  var get = Ember.get, isGlobalPath = Ember.isGlobalPath, normalizePath = Ember.Handlebars.normalizePath;

  var getProp = function(context, property, options) {
    if (isGlobalPath(property)) {
      return get(property);
    } else {
      var path = normalizePath(context, property, options.data);
      return get(path.root, path.path);
    }
  };

  Handlebars.registerHelper('can', function(permissionName, property, options){
    var attrs, context, key, path, permission;

    // property is optional, if we've only got 2 arguments then the property contains our options
    if (!options) {
      options = property;
      property = null;
    }

    context = (options.contexts && options.contexts[0]) || this;

    attrs = {};

    // if we've got a property name, get its value and set it to the permission's content
    // this will set the passed in `post` to the content eg:
    // {{#can editPost post}} ... {{/can}}
    if (property) {
      attrs.content = getProp(context, property, options);
    }

    // if we've got any options, find their values eg:
    // {{#can createPost project:Project user:App.currentUser}} ... {{/can}}
    for (key in options.hash) {
      path = options.hash[key];
      attrs[key] = getProp(context, path, options);
    }

    // find & create the permission with the supplied attributes
    permission = App.Permissions.get(permissionName, attrs);

    // ensure boundIf uses permission as context and not the view/controller
    // otherwise it looks for 'can' in the wrong place
    options.contexts = null;

    // bind it all together and kickoff the observers
    return Ember.Handlebars.helpers.boundIf.call(permission, "can", options);
  });
{% endraw %}{% endcodeblock %}

That's it, now we can show/hide content based on user permissions and have them automatically update when a user
logs in or their permissions change.