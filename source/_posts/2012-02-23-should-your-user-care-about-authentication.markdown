---
layout: post
title: "Does your User care about authentication?"
date: 2012-02-23 14:32
comments: true
categories: ruby
---

These are my notes from a lightning talk I gave at [this months LRUG](http://lanyrd.com/2012/lrug-february/).

We've got a Rails app which lets a user login with a username and password, nothing out of the ordinary:

{% codeblock lang:ruby %}
class SessionsController < ApplicationController
  def create
    if self.current_user = User.authenticate_with_password(params)
      redirect_to root_url
    else
      render :new
    end
  end
end

class User < ActiveRecord::Base
  def self.authenticate_with_password(params)
    first(username: params[:username]).
      try(:authenticate_password, params[:password])
  end

  def authenticate_password(unencrypted_password)
    if BCrypt::Password.new(password_digest) == unencrypted_password
      self
    else
      false
    end
  end
end
{% endcodeblock %}

SessionsController#create tries to find a User with the supplied username and password and then redirects or re-displays the login form.

A few months go by and we decide to let users login against a number of third party services, using something like [OmniAuth](https://github.com/intridea/omniauth)
to do the actual heavy lifting of communicating with the providers. Our controller and model have bloated a fair bit:

{% codeblock lang:ruby %}
class SessionsController < ApplicationController
  def create
    if self.current_user =  if params[:facebook_id]
                              User.authenticate_with_facebook(params)
                            elsif params[:google_id]
                              User.authenticate_with_google(params)
                            elsif params[:twitter_id]
                              User.authenticate_with_twitter(params)
                            elsif params[:github_id]
                              User.authenticate_with_github(params)
                            else
                              User.authenticate_with_password(params)
                            end
      redirect_to root_url
    else
      render :new
    end
  end
end

class User < ActiveRecord::Base
  def self.authenticate_with_password(params)
    first(username: params[:username]).try(:authenticate_password, params[:password])
  end

  def self.authenticate_with_facebook(params)
    first(facebook_id: params[:facebook_id])
  end

  def self.authenticate_with_google(params)
    first(google_id: params[:google_id])
  end

  def self.authenticate_with_twitter(params)
    first(twitter_id: params[:twitter_id])
  end

  def self.authenticate_with_github(params)
    first(github_id: params[:github_id])
  end

  def authenticate_password(unencrypted_password)
    if BCrypt::Password.new(password_digest) == unencrypted_password
      self
    else
      false
    end
  end
end
{% endcodeblock %}

There's not much good to say about that code, but I've seen similar things in plenty of apps over the years. At least we're not doing the db calls directly in the controller.

## Single Responsibility Principle

The [Single Responsibility Principle](http://en.wikipedia.org/wiki/Single_responsibility_principle) basically says that an object should be responsible for one thing only.
Thinking about that another way, we can also say that a single change should only touch one part of the system.

With the code as it stands, if we add or remove an authentication method we've got to change code in both the controller and the model.
Fixing that is pretty simple, let's just move the logic for deciding which authentication method we're using into the model:

{% codeblock lang:ruby %}
class SessionsController < ApplicationController
  def create
    if self.current_user = User.authenticate(params)
      redirect_to root_url
    else
      render :new
    end
  end
end

class User < ActiveRecord::Base
  def self.authenticate(params)
    if params[:facebook_id]
      authenticate_with_facebook(params)
    elsif params[:google_id]
      authenticate_with_google(params)
    elsif params[:twitter_id]
      authenticate_with_twitter(params)
    elsif params[:github_id]
      authenticate_with_github(params)
    else
      authenticate_with_password(params)
    end
  end
end
{% endcodeblock %}

All tidy, now if we change how authentication works we only have to make changes in one part of the codebase.

## Skinny controllers, fat models

This is basically the [skinny controllers, fat models](http://weblog.jamisbuck.org/2006/10/18/skinny-controller-fat-model) principle which encourages moving your business logic out of your controllers and into your models.

This lets us keep nice clean controllers and views, but we can end up with massively bloated models.
What we should aim for is not just skinny controllers, but skinny models too. In fact, we want really want everything to be skinny.
Lets do some refactoring!

## When all you have is a hammer...

Being a Ruby developer, our first port of call is simply to move out the authentication code into a module,
using the standard include/extend pattern to bring both class and instance methods along:

{% codeblock lang:ruby %}
class User < ActiveRecord::Base
  include UserAccess
end

module UserAccess
  def self.included(base)
    base.extend ClassMethods
  end

  module ClassMethods
    def authenticate(params)
      # ...
    end

    def authenticate_with_password(params)
      # ...
    end

    def authenticate_with_facebook(params)
      # ...
    end
  end

  def authenticate_password(unencrypted_password)
    # ...
  end
end
{% endcodeblock %}

[ActiveSupport::Concern](http://api.rubyonrails.org/classes/ActiveSupport/Concern.html) can clean this up a little bit and brings a few other tricks to the table.

## Have we actually done anything?

We've got better organised code and given this concept of "user access" a name by wrapping it up in a module.
We've also made it easier to test as we can test this module outside of Rails making our tests faster, which is nice.

In effect all we're doing is cleaning up the source so it's easier to find things, we're not modelling the problem any better.
We're still treating the User as a bucket of methods without giving any real thought as to where these things belong.

Over time we include more and more functionality into the one model, hardly a "single responsibility":

{% codeblock lang:ruby %}
class User < ActiveRecord::Base
  include UserAccess
  include NameAccessors
  include LoginAuditing
  include UserSerialising
  include RecencyLogging
  include UserInvites
  include UserAvatar
  include UserPermissions
  include Kitchen::Sink
  ...
{% endcodeblock %}

## What should the User care about?

All the User class should really care about is persistence - storing and retreiving the attributes from the database.

Anything other than that is really outside of its scope, I'd argue that even observers, validation & callbacks don't belong in the model most of the time.

If we look back at the UserAccess module, it's pretty self contained and would quite happily exist outside of the User model.
Other than the `#authenticate_password` method it's all just class methods which go off and try and find a User.

With very few changes we can make this a stand-alone module:

{% codeblock lang:ruby %}
module UserAccess
  def self.authenticate(params)
    # ...
  end

  def self.authenticate_with_password(params)
    user = User.first(username: params[:username])
    if BCrypt::Password.new(user.try(:password_digest)) == params[:password]
      user
    end
  end

  def self.authenticate_with_facebook(params)
    # ...
  end
end
{% endcodeblock %}

I've inlined the instance method, it could just as easily be another class method which takes the user and password, it doesn't really matter at this point.
The important thing is that it has allowed us to remove the mixin from the User model, leaving it doing just one thing - handling persistence.

The controller needs changing to point to our new stand-alone module, but that's a trivial change:

{% codeblock lang:ruby %}
class SessionsController < ApplicationController
  def create
    if self.current_user = UserAccess.authenticate(params)
      redirect_to root_url
    else
      render :new
    end
  end
end
{% endcodeblock %}

## Skinny controller, skinny model, we're done. Right?

So we've got a nice clean model and a nice clean controller, but what about the UserAccess module?
It's a bit of a mess, but at least it's swept into one self contained part of the system so we can refactor this without affecting anything else.

Back to the Single Responsibility Principle, lets split up the module into a sub-module per authentication type,
that way each is nicely self contained and responsible purely for the one authentication scheme:

{% codeblock lang:ruby %}
module UserAccess
  def self.authenticate(params)
    if params[:facebook_id]
      Facebook.authenticate(params)
    elsif params[:google_id]
      Google.authenticate(params)
    elsif params[:twitter_id]
      Twitter.authenticate(params)
    elsif params[:github_id]
      GitHub.authenticate(params)
    else
      Password.authenticate(params)
    end
  end

  module FaceBook
    def self.authenticate(params)
      # ...
    end
  end

  module Password
    def self.authenticate(params)
      # ...
    end
  end
end
{% endcodeblock %}

That's a bit cleaner, but we've still got that nasty `.authenticate` method and we're back with the problem that if we add or remove an authentication method we're going to have
to change code in more than one place. Should the top level `UserAccess` module really know about the logic which determines which sub-module to use?

## Chain of Responsibility

What we really want to do is move the logic from the `.authenticate` method down into the sub-modules.
This is where something like the [Chain of Responsibility](http://en.wikipedia.org/wiki/Chain-of-responsibility_pattern) pattern comes in handy.

Instead of choosing which authentication type to use up front, we ask each module one at a time whether it can handle the submitted parameters:

{% codeblock lang:ruby %}
module UserAccess
  AUTH_TYPES = [
    FaceBook,
    Twitter,
    GitHub,
    Password
  ]

  def self.authenticate(params)
    AUTH_TYPES.detect{|auth| auth.can_handle?(params) }.try(:authenticate, params)
  end

  module FaceBook
    def self.can_handle?(params)
      params.has_key?(:facebook_id)
    end

    def self.authenticate(params)
      # ...
    end
  end

  module Password
    def self.can_handle?(params)
      params.has_key?(:username) && params.has_key?(:password)
    end

    def self.authenticate(params)
      # ...
    end
  end
end
{% endcodeblock %}

Now we just loop through the authentication modules and find the first one which can handle the parameters we have and then calls authenticate on it.

Each module is completely responsible for its logic and if we add or remove an authentication method we only have to change one thing.

I'm using an array of types here to loop through, but you could also just loop through the sub-modules of the `UserAccess` module.
You could also get rid of the `.can_handle?` method by just calling `.authenticate` and returning the User for success, nil for a failure and false if it doesn't handle the params,
but I prefer to be explicit and having a return nil vs false can lead to much confusion.

Here's a high level overview of what we've ended up with, skinny controller, skinny model and a skinny set of modules all responsible for one thing only:

{% codeblock lang:ruby %}
class SessionsController < ApplicationController
  def create
    UserAccess.authenticate(params)
  end
end

class User < ActiveRecord::Base
end

module UserAccess
  def self.authenticate(params)
  end

  module FaceBook
  end

  module Google
  end

  module GitHub
  end

  module Twitter
  end

  module Password
  end
end
{% endcodeblock %}

There's plenty of other approaches to refactoring code like this, but I hope this gives a few ideas beyond "I know, I'll move it into a module".
