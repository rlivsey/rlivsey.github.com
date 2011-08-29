---
layout: post
title: "Ship Ship Hooray!"
date: 2011-08-29 17:30
comments: true
categories: minutebase startups
---

It's been a few days since we turned on payment and, in my eyes at least, officially shipped [MinuteBase](http://minutebase.com). We've been in beta for quite some time, but having paying customers is the major milestone which transforms it from a "project" into an actual business. I've learned a huge amount and thought that now is a good time to look back at our progress.

## What we did well

### We based MinuteBase on a problem we actually experienced

I've worked on a number of projects over the years which I thought were a good idea, but weren't solving a problem that I actually faced. This lead to either solving the wrong problem, or just getting bored once the rush of building something new wore off. Just because you experience a problem doesn't necessarily mean that it's a viable business, but it certainly helps.

### I had a co-founder

This has been essential for getting through the inevitable slumps in motivation which occur. It's much easier to quit when there's no one else involved. We've not always agreed, far from it, but the many hours of discussion and arguments have lead to a much better product.

Having a co-founder with complementary skills is also essential. I'm a pretty good developer but I'm never going to be mistaken for a designer. I like to think I have a reasonably good eye, but put me in front of PhotoShop for a year and it's unlikely that I'll produce anything as beautiful as MinuteBase.

### We launched early

Our first version wasn't quite an MVP, we probably could have launched earlier, but looking back it's amazing what features we didn't have. Having actual users other than ourselves tell us what they are missing has been fantastic. It also means we've been able to focus on things which are actual problems, instead of imagined "essential" features which in the end don't matter all that much.

### We dog-fooded right from the beginning

Because MinuteBase was built to solve a problem we actually had, we were able to use it right from the earliest stages in the companies we worked for and to collaborate with our clients. Using it every day means we have a better idea of where we need to improve than having to wait for other people to tell us.

I'm even using it right now to write up this blog post, you can [see it at MinuteBase here](http://livsey.minutebase.com/meetings/ship-ship-hooray).

## Lesson learned

### Too long iterations

MinuteBase 2 initially started off as some small improvements to the prototype app, there's nothing there which we couldn't have added in iteratively as we went. Instead we put too many changes and into one release and ended up taking far too long to get changes in-front of our users where we could get feedback.

### Changed technology stack

The first version was built using Merb, MySQL, DataMapper and Prototype. Our version 2 is Rails 3, MongoDB, MongoMapper, ElasticSearch and jQuery. Very little code survives from the initial prototype.

This meant that far too much time was spent re-building things which already worked instead of on improvements. It also meant that it took us much longer to get in front of our users as we couldn't run both versions side by side sharing the same database.

However, building one to throw away meant that when we were building "version 2" we had a much better idea of what worked and what didn't. We were able to make more fundamental changes to the way the app worked than if we were iteratively changing the prototype.

### We didn't turn on payment early enough

There's no reason why we couldn't have enabled payment 6 months ago, in version 1 of the app. Instead we convinced ourselves that it wasn't ready, and that we'd turn on payment after "this one next feature" or bug fix. Of course because our iterations were too large, that "one next feature" ended up taking months, during which time we could have been bringing in money and proving the business model. We even had people asking how they could pay us!

### No "business guy"

After going through this process I think the ultimate founding team is a designer, a developer and a business-person. While we're building the product there's no one focused on sales & marketing or just getting out there and talking to people.

That's not to say that we shouldn't or couldn't be doing more of that side of things ourselves, but it's easy to put off going out & talking to people, or drumming up press until after you've "finished" building the app. And you never really finish.

### We've been too quiet

If you look at the MinuteBase blog or Twitter feed, you'll see there's not a lot there. All the posts are about changes to the app and new features.

We need to get much better at producing original content and linking to interesting material so that the blog itself can work as a marketing channel. As it stands, unless you're a MinuteBase user, there's not much point subscribing to our blog or following us on Twitter.

This has to change and we're going to be spending much more time on this in future.

### Too specific a name

Our original focus was to build the best tool to take meeting minutes and we chose our name based on that. Call it scope creep, or pivoting, but the MinuteBase of today does far more than just meeting minutes.

With the introduction of workspaces, MinuteBase has turned into a great project management tool but our name is still focused on one part of the app.

Time will tell how much of a problem this is, but having a more generic name or something focused on meetings instead of minutes could have been a better idea.

## In Closing

So many of these lessons are things I already knew.

In my day job managing projects over the years I preached agile development, small iterations, test driven development.

Even things I didn't have first hand experience in I should have known via talking to others or from [Hacker News](http://news.ycombinator.com) over the years.

For some reason when you're building it for yourself and don't have anyone to report to these things go out of the window!

This process has made me a much better developer, a much better manager and no matter what happens to MinuteBase I've no doubt that it makes me a far more capable person than I was before.

If you go to meetings, or manage projects, why not give [MinuteBase](http://minutebase.com) a try.