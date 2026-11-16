# StetCSS runtime from a CDN

The StetCSS browser runtime, loaded from a CDN with no build step.

```html
<!DOCTYPE html>
<html lang="en" hidden>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Keep both packages on the same release. base.css comes first: it declares the cascade layer order. -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@stet-css/preset@0.1.0/src/base.css">
  <script src="https://cdn.jsdelivr.net/npm/@stet-css/runtime@0.1.0" onerror="document.documentElement.hidden = false"></script>
</head>

<body>
  <h1 class="italic m:12x fg:strong font:40px font:heavy">Hello World</h1>
</body>

</html>
```

`iife.html` loads the browser runtime and the default preset's `base.css` from jsDelivr, with no build step. It knows only the default preset; for production, generate static CSS with a build integration instead.

## Documentation

The [runtime README](../../packages/runtime/README.md#cdn) covers the CDN entry: which URLs to use, what `hidden` does when startup fails, and what the CDN runtime cannot do.
