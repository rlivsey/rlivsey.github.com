---
layout: post
title: "Breaking up your routes in Ember.js"
date: 2012-10-09 18:01
comments: true
categories: ember javascript
---

The router is the core of any [Ember.js](http://emberjs.com) application and it can get big, fast.
Keeping your entire application's router in one file is going to lead to madness. Thankfully it's quite a simple problem to resolve.

Lets imagine an application with a number of discrete sections - a blog, a list of members and an area to browse uploaded files.
We have an `init.js` which sets up the application:

{% codeblock init.js lang:javascript %}
  // ...

  App.Router = Ember.Router.extend({
    root: Ember.Route.extend({
      home: Ember.Route.extend({
        route: "/"
      }),
      blog: Ember.Route.extend({
        route: "/blog",
        posts: Ember.Route.extend({
          route: "/"
        }),
        post: Ember.Route.extend({
          route: "/:id",
        })
      }),
      members: Ember.Route.extend({
        route: "/members",
        list: Ember.Route.extend({
          route: "/"
        }),
        member: Ember.Route.extend({
          route: "/:id"
        })
      }),
      files: Ember.Route.extend({
        route: "/files",
        list: Ember.Route.extend({
          route: "/"
        }),
        file: Ember.Route.extend({
          route: "/:id"
        })
      })
    })
  })

  // ...
{% endcodeblock %}

Looks pretty straightforward, but that's without any outlet management, serializing/deserializing, action handlers etc...

Breaking this up is pretty simple.
Anywhere we say `Ember.Route.extend` we're defining an anonymous class,
so in order to split up the router we can just give the class a name and move it to a file of its own.

{% codeblock routes/homepage.js lang:javascript %}
  App.HomePageRoutes = Ember.Route.extend({
    route: "/"
  });
{% endcodeblock %}

{% codeblock routes/blog.js lang:javascript %}
  App.BlogRoutes = Ember.Route.extend({
    route: "/blog",
    posts: Ember.Route.extend({
      route: "/"
    }),
    post: Ember.Route.extend({
      route: "/:id",
    })
  });
{% endcodeblock %}

{% codeblock routes/members.js lang:javascript %}
  App.MembersRoutes = Ember.Route.extend({
    route: "/members",
    list: Ember.Route.extend({
      route: "/"
    }),
    member: Ember.Route.extend({
      route: "/:id"
    })
  });
{% endcodeblock %}

{% codeblock routes/files.js lang:javascript %}
  App.FilesRoutes = Ember.Route.extend({
    route: "/files",
    list: Ember.Route.extend({
      route: "/"
    }),
    file: Ember.Route.extend({
      route: "/:id"
    })
  });
{% endcodeblock %}

Now our main router definition looks like:

{% codeblock init.js lang:javascript %}
  App.Router = Ember.Router.extend({
    root: Ember.Route.extend({
      home: App.HomePageRoutes,
      blog: App.BlogRoutes,
      members: App.MembersRoutes,
      files: App.FilesRoutes
    })
  })
{% endcodeblock %}

Clean, simple and everything in its own place.

**Update**: As [Jo Liss points out](http://livsey.org/blog/2012/10/09/breaking-up-your-routes-in-ember-dot-js/#comment-677694778),
you can specify the base route when you assemble the router as opposed to hard coding it in each section. I really like this, feels very similar to
how [engines are mounted in Rails](http://api.rubyonrails.org/classes/Rails/Engine.html).

{% codeblock init.js lang:javascript %}
  App.Router = Ember.Router.extend({
    root: Ember.Route.extend({
      home: App.HomePageRoutes.extend({
        route: "/"
      }),
      blog: App.BlogRoutes.extend({
        route: "/blog"
      }),
      members: App.MembersRoutes.extend({
        route: "/members"
      }),
      files: App.FilesRoutes.extend({
        route: "/files"
      }),
    })
  })
{% endcodeblock %}


