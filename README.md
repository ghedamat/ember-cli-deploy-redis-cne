# Ember-cli-deploy-redis-cne

This is a redis-adapter implementation to use [Redis](http://redis.io) with
[ember-cli-deploy](https://github.com/ember-cli/ember-cli-deploy).

This was cloned and modified from [here](https://github.com/LevelbossMike/ember-deploy-redis).

Kind of a hack since the feature I'm emulating is partially coming in ember-cli-deploy v0.5.0. Basically, we parse the index file and only store the relevant file references instead of the WHOLE index. This is useful if your server adds a large amount of markup to each route, and you are only interested in the javascript/css sources.

WARNING. Implementation is SPECIFIC to thescene-frontend. No real reason to change it.

### Example:

Instead of an index file, json gets stored like this:
```json
{
  "scripts": {
    "vendor":"<your vendor script, I.E. /assets/vendor.js>",
    "app":"<your app script, I.E. /assets/<your app name>.js>"
  },
  "stylesheets": {
    "vendor":"<your vendor script, I.E. /assets/vendor.js>",
    "app":"<your app script, I.E. /assets/<your app name>.js>"
  },
  "environment": {
    "content":"<the content property of your environment meta tag>",
    "name":"<your-app-name>/config/environment"
  }
}
```

And then on the server:
```erb
<head>

<!-- `@cli_assets` points to the object above, fetched from redis -->
<!-- Ember needs this meta tag to determine your apps environment -->
<meta name="<%= @cli_assets['environment']['name'] %>" content="<%= @cli_assets['environment']['content'] %>">
<!-- ...lots of other meta tags... -->

<link rel="stylesheet" href="<%= @cli_assets['stylesheets']['vendor'] %>">
<link rel="stylesheet" href="<%= @cli_assets['stylesheets']['app'] %>">
</head>
<body>

<noscript>
  <!-- a bunch of stuff rendered for robots and stuff -->
</noscript>

<script id="vendor-script" src="<%= @cli_assets['scripts']['vendor'] %>"></script>
<script id="app-script" src="<%= @cli_assets['scripts']['app'] %>"></script>
</body>
```
