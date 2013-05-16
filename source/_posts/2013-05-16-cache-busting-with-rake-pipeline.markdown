---
layout: post
title: "Cache Busting with Rake Pipeline"
date: 2013-05-16 18:24
comments: true
categories: ruby asset-pipeline
---

I'm using [rake-pipeline](https://github.com/livingsocial/rake-pipeline) on a project at the moment and wanted to implement cache-busting by renaming asset files if they have changes.

A quick look at [rake-pipeline-web-filters](https://github.com/wycats/rake-pipeline-web-filters) and we see the [Cache Buster](https://github.com/wycats/rake-pipeline-web-filters/blob/master/lib/rake-pipeline-web-filters/cache_buster_filter.rb) filter, it looks just the job:

{% codeblock Assetfile lang:ruby %}
output "public"

input "app" do
  match "javascripts/**/*.coffee" do
    coffee_script
  end

  match "javascripts/**/*.js" do
    concat "javascripts/app.js"
    cache_buster
    uglify
    gzip
  end
end
{% endcodeblock %}

Ok, not so fast. That would have been a rather short blog post...

It turns out that the cache buster [doesn't work if it's after a concat](https://github.com/wycats/rake-pipeline-web-filters/issues/27) and this is an issue which is impossible to fix with the way rake-pipeline works.

Rake pipeline filters generate the filenames they output when they are initialized, which means you can't have a filter which has a filename based on the output of a previous filter as you'd want for cache busting. When the cache buster tries to generate the filename the concat hasn't yet happened so it has no contents to work with.

If we can't dynamically change the filename in a filter, how do we write a cache buster for rake-pipeline which actually works? We need to check all the files *before* rake-pipeline runs and use that knowledge to set the output name, something like:

{% codeblock Assetfile lang:ruby %}
output "public"

JS_VERSION = ?? # magic happens here

input "app" do
  match "javascripts/**/*.coffee" do
    coffee_script
  end

  match "javascripts/**/*.js" do
    concat "javascripts/app-#{JS_VERSION}.js"
    cache_buster
    uglify
    gzip
  end
end
{% endcodeblock %}

But how do we set `JS_VERSION`?

We want to generate some kind of key based on the contents of the files in the `javascripts` directory which will only change if
there's a change to the files. We could iterate through each of the files and get the MD5 hash of each, then take an MD5 of all the hashes to generate one master hash, or maybe we loop through and find the most recent mtime and generate a key from that? All sounds a bit messy and resource intensive for such a simple task.

If only there was a way we could find out the last change of a file in a directory, some kind of system which tracked all the versions of our files that we could ask...

Turns out git is quite good at tracking changes to files, it's also rather easy to get a log of what's changed in a directory and we can ask for the hash of the most recent change with `git log -n1 --pretty=format:"%H" app/javascripts`.

Plugging that into the above we get:

{% codeblock Assetfile lang:ruby %}
output "public"

JS_VERSION = `git log -n1 --pretty=format:"%H" app/javascripts`

input "app" do
  match "javascripts/**/*.coffee" do
    coffee_script
  end

  match "javascripts/**/*.js" do
    concat "javascripts/app-#{JS_VERSION}.js"
    cache_buster
    uglify
    gzip
  end
end
{% endcodeblock %}

Now we have a new `JS_VERSION` any time there are any changes committed to the app/javascripts directory.

Job done!