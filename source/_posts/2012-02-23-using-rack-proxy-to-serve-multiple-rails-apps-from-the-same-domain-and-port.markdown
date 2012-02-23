---
layout: post
title: "Using Rack::Proxy to Serve Multiple Rails Apps From the Same Domain &amp; Port"
date: 2012-02-23 13:38
comments: true
categories:
---

I'm currently working on a project which has an API backend and a JS frontend which consumes that API.
Both parts are built with Rails and must be served from the same domain and port because of the [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy).

The API will be served from a sub-directory like so:

* http://example.com - serves the JS app
* http://example.com/api - serves the API

It's pretty trivial to set this up with nginx, but developing locally is a bit trickier.
Running both apps with `rails server` will put them on different ports and the JS app won't be able to communicate with the API.

We could setup a local nginx config on our development machines, but this makes it harder to setup breakpoints in ruby-debug amongst other things.

Rails apps are just Rack apps, so my first thought was to create a config.ru which mounts both Rails apps:

{% codeblock config.ru lang:ruby %}
require File.expand_path('../api/config/environment',  __FILE__)
require File.expand_path('../frontend/config/environment',  __FILE__)

run Rack::Builder.new {
 map "/api" do
   run API::Application
 end

 map "/" do
   run Frontend::Application
 end
}
{% endcodeblock %}

This raises an error saying `You cannot have more than one Rails::Application` so that's that idea out the window.

We could turn the API into a Rails Engine and mount that inside the other app, but we really want these two apps to be completely separate and not have to know about each other outside of the documented API.

The obvious solution is to use a proxy to let us run each Rails app independently and have the proxy forward requests to each one depending on the URL.

The simplest thing I could think to setup a proxy server was to use [Rack::Proxy](https://github.com/ncr/rack-proxy) and about 5 minutes later I had a working solution:

{% codeblock config.ru lang:ruby %}
require 'rack-proxy'

class AppProxy < Rack::Proxy
  def rewrite_env(env)
    request = Rack::Request.new(env)
    if request.path =~ %r{^/api}
      env["HTTP_HOST"] = "localhost:3001"
    else
      env["HTTP_HOST"] = "localhost:3000"
    end
    env
  end
end

run AppProxy.new
{% endcodeblock %}

Pretty simple, we just rewrite the HTTP_HOST depending on whether or not the requested path starts with "/api".

Now we fire up the frontend and backend Rails apps on port 3000 and 3001 respectively, run the proxy on another port and point the browser there.

Using `rackup config.ru` worked fine, but when I tried to run the proxy using passenger-standalone I got the following error:

{% codeblock $ passenger start -p 9999 %}
=============== Phusion Passenger Standalone web server started ===============
PID file: /Users/rlivsey/Sites/multi-rails-experiment/tmp/pids/passenger.9999.pid
Log file: /Users/rlivsey/Sites/multi-rails-experiment/log/passenger.9999.log
Environment: development
Accessible via: http://0.0.0.0:9999/

You can stop Phusion Passenger Standalone by pressing Ctrl-C.
===============================================================================
2012/02/23 14:11:52 [error] 9691#0: *4 "/Users/rlivsey/Sites/multi-rails-experiment/public/index.html" is not found (2: No such file or directory), client: 127.0.0.1, server: _, request: "HEAD / HTTP/1.1", host: "0.0.0.0"
2012/02/23 14:12:07 [error] 9691#0: *5 "/Users/rlivsey/Sites/multi-rails-experiment/public/index.html" is not found (2: No such file or directory), client: 127.0.0.1, server: _, request: "GET / HTTP/1.1", host: "localhost:9999"
2012/02/23 14:12:07 [error] 9691#0: *5 open() "/Users/rlivsey/Sites/multi-rails-experiment/public/favicon.ico" failed (2: No such file or directory), client: 127.0.0.1, server: _, request: "GET /favicon.ico HTTP/1.1", host: "localhost:9999"
{% endcodeblock %}

This is because passenger-standalone sets up the nginx config expecting there to be a `public` directory, so I just created an empty one and everything worked fine.

With this setup we can also trivially switch the API host to point to production, letting us develop the frontend against the production API should we want to test the UI with live data.

