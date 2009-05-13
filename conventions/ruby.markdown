---
layout: default
title: Ruby
---

<div class="wip">
  <p>
    This is a work in progress...
  </p>
</div>

# Intro

Prefer readability over cleverness or speed. 

The best applications are coded properly. 

Code is for computers to execute, but for humans to read. 

This sounds like an obvious statement, but by 'properly', I mean that the code not only does its job well, but is also easy to add to, maintain and debug.

1. IN ESSENCE: ALL CODE SHOULD BE READABLE!
2. DO NOT OPTIMIZE for performance - OPTIMIZE FOR CLARITY OF CODE

It might be fast, but if it's hard to read then it's going to be much more difficult to understand what's going on and maintian.

Think about the person who has to come after you, you want them to think "wow, what nice readable code", not "what the hell does this do?!".

# References

*  http://www.caliban.org/ruby/rubyguide.shtml
*  http://wiki.github.com/rails/rails
*  http://chadfowler.com/2009/4/1/20-rails-development-no-no-s

# Whitespace

Use whitespace around the assignment operator, except then assigning default values in method argument lists, i.e.:

    foo = 1

not:

    foo=1

and:

    def foo(bar, baz=0)

not:

    def foo(bar, baz = 0)

Use whitespace to improve the legibility of complex expressions, but do not use whitespace to separate a method name from its parameter list. Within the parameter list itself, however, whitespace is fine.

For example, this is fine:

    foo.bar( baz )

but this is not:

    foo.bar (baz)

One last place where whitespace is not appropriate is before a comma.


# Indentation

The Ruby convention is to use 2 spaces for indentation.

Don't use tabs, or mix tabs and spaces.

Make sure that your indentation is consistent. Not only does it make your code more readable, but it makes it easier to spot bugs.

There's something wrong with this code, how long does it take to spot it?
    
    def my_details
       if request.post?
          @user = User.new(params)  
        if @user.valid?
         if @user.save
          unless session[:account_step2].blank?
              ...
            end
          return
          else
              flash.now[:api_error] = error_message
         end
       else
        errors_to_fields(@user)
      end
    end

The exact same code indented properly makes it easy to spot that it's missing an 'end'

    def my_details
      if request.post?
        @user = User.new(params)
        if @user.valid?
          if @user.save
            unless session[:account_step2].blank?
              ...
            end
            return
          else
            flash.now[:api_error] = error_message
          end
        else
          errors_to_fields(@user)
        end
    end


# Vertical alignment 

When you have common styles of statements on multiple lines, line them up vertically:

    def initialize(id, description, name)
      @id           = id
      @description  = description
      @name         = name
    end    

    OpenIdAccount.create(
      :user     => self,
      :account  => self.account,
      :url      => self.openid_url
    )

# Iterators

I've seen this in a number of places:

    stuff.each do |item|
      # lots of 
      # lines of
      # code ...
    end unless stuff.empty?

There's a few things wrong with this:

## 1 - Locality

The 'unless' statement is easy to miss as it's all the way at the end of the block. It would be much better to move the statement to surround the iteration as it's much more obvious what's going on and you don't have to hunt for the logic:

    unless stuff.empty?
      stuff.each do |item|
        # lots of 
        # lines of
        # code ...
      end
    end

That's much more readable, but brings me onto #2

## 2 - Useless / redundant logic

If 'stuff' is empty, then iterating over it isn't going to execute anything anyway, so the 'unless' statement is completely useless.

There's no difference in the code above, to simply saying:

    stuff.each do |item|
      # lots of 
      # lines of
      # code ...
    end

# Strings

Instead of trying to decide where to use single quotes and where to use double, it's easier just to always use double quotes.

Not a hard and fast rule, but in general there's no penalty for doing so and it makes it much easier if you need to add interpolation later.

IE, it's much easier to change

    x = "jack has 5 beans"

to

    x = "jack has #{beans.size} beans"
    
Than it is:

    x = 'jack has 5 beans'

As you have to remember to change the quotes too. I've seen this happen a number of times where this would end up as something like:

    x = 'jack has #{beans.size} beans'

If you have quotes inside of a string, prefer to use alternative forms of interpolation instead of escaping them. 

    link = %Q(<a href="http://google.com" class="something">Hello</a>)

Is much more readable and less prone to error than:

    link = "<a href=\"http://google.com\" class=\"something\">Hello</a>"

# Blocks

Blocks can either be formed using do and end, or with braces ({}).

Standard practice dictates that do and end should be used unless the entire block fits in one line.

For example:

    foo.each do |x|
      puts x
      x *= 2
      puts x
    end

    foo.select{|x| x > 5}

Whilst it is possible to use semicolons to put more than one statement on a line, and thus fit in braces, this shouldn't be done:

    foo.each{|x| puts x; x *= 2; puts x }

Again, opt for readability over cutting down on lines of code.

# Booleans

Ruby considers nil and false to be false, and all other values to be true. This is one of the major obvious differences from Perl, with which Ruby shares many superficial similarities. In Perl, 0, the null string and undef are all considered false for the purposes of Boolean logic. In Ruby, however, 0 and the null string both evaluate to true. Ruby also has the Boolean values of true and false, unlike Perl.

Don't compare booleans against true/false/nil

Use:
    
    if monkey.has_banana?
      ...
    end

and not:

    if monkey.has_banana? == true
      ...
    end

and 

    if monkey
      ...
    end
    
instead of:

    if monkey == nil
      ...
    end  

# Boolean logic

To negate an if statement, use unless:

    unless monkey.has_banana?
      ...
    end
    
And not any of:

    if !monkey.has_banana?
      ...
    end
    
    if not monkey.has_banana?
      ...
    end
    
And certainly not:

    if monkey.has_banana?
      # this block intentionally left blank
    else
      ...
    end

# use && and ||, not and or or

Whilst it is tempting to use the more 'english' versions such as:

    if monkey.has_banana? and !bananas.empty?
      ..
    end

It's much better to stick to:

    if monkey.has_banana? && !bananas.empty?
      ..
    end
    
The reasons for 'and' and 'or' is not to make things easier to read, it's because they bind differently.

In the examples above, it doesn't really make any difference, however the following act very differently:

    puts nil || "foo"   # parses to: puts( nil || "foo" )  => prints "foo"
    puts nil or "foo"   # parses to: puts( nil ) || "foo"  => prints nil 

The only reason you should use 'and' or 'or' is to take advantage in the different binding strengths, but even then I'd argue that you probably shouldn't be using them.

One common example is from Rails:

    render(:partial => 'test') and return

A more readable version which does the same thing would be:

    return render(:partial => 'test')

# Use the language features

## Implicit return

I personally prefer to always use the implicit return unless it makes it more readable to explicitly do so.

# Explicit receivers

Always use explicit receivers inside methods to prevent accidental local variable assignment.

For example, the following won't raise any errors and so will silently fail:

    class Invite
      def accepted!
        state        = :accepted
        actioned_at  = Time.now
        save
      end
    end

When Invite#accepted! gets called, state and actioned_at are set to local variables, save gets called fine because it's a method but doesn't save the changes you want. 

This should be the following instead:

    class Invite
      def accepted!
        self.state        = :accepted
        self.actioned_at  = Time.now
        self.save
      end
    end

# Comments

## Non-chatty comments

> I don’t tend to write any comments, so I may be on the anti-comment side to a fault. My goal is always to write code that is clear enough that comments don’t add anything. If you name everything well and keep your classes, modules, and methods short, you’re already going to make comments redundant in a lot of cases.

> Whenever I see a comment inside a method definition, I consider it a bad sign. In most cases, whenever you encounter a comment inside a method, it’s a marker for where code should be extracted into a new method.

Chad Fowler


The code should be readable and self explanatory. Ideally there should be no need for any comments at all, as the code should be clear and speak for itself.

Here's a real (slightly cut down) example of comment abuse:

    def self.get_raw_api_response(params)
      # Checking if the coupon is of meeting type
      if is_meeting_coupon? params
        # It's a list of them?
        if is_list_meeting_coupon? params
          # Make n calls get all the response and parse it
          api, result = get_list_meeting_data_and_parse(parse_meeting_data_to_api_call(params), true)
        else # No! It's only one
          # Getting data parsed and returning it
          api, result = get_single_meeting_data(params, true)
        end
      # Now I am checking if the params show me that the coupon is of event type
      elsif is_event_coupon? params
        # It's a list?
        if is_list_event_coupon? params
          api, result = get_list_event_data(params)
        else # Ok! Only a little event
          api, result = get_single_event_data(params, true)
        end
      else
        raise "Can't get this coupon"
      end
    end

I'd argue that every single one of those comments could be removed without any loss of clarity and that the code would actually be easier to read and follow with out them.

# Levels of nesting

Aim for as few levels of nesting as possible. If you're more than two levels deep, it tends to be a warning that the code needs refactoring and possibly broken up into smaller methods. 

One pattern I like is to return early from a method instead of surrounding code with levels of logic, for example:

    def something(items)
      return if items.empty?
      items.collect{|x| x + 5}
    end
  
In preference to:

    def something(items)
      unless items.empty?
        items.collect{|x| x + 5}
      end
    end

This is especially the case if you have multiple levels of logic:

IE the following is much more readable and easier to modify:

    def something(items)
      return if items.empty?
      return if items.include?(5)
      return if items.size == 7

      items.collect{|x| x + 5}
    end

than:

    def something(items)
      unless items.empty?
        unless items.include?(5)
          unless items.size == 7
            items.collect{|x| x + 5}
          end
        end
      end
    end

# Short methods

Smalltalk people, as a collective culture, seem to get this right. Kent Beck documents a simple pattern in his Smalltalk Best Practice Patterns called “Compose Method”. He says that one way to determine whether a new method is required is whether all of the code in a given method operates at the same level of abstraction. That’s a simple but powerful rule. Think about it next time you’re coding and I think you’ll agree.
Fowler




# Exceptions