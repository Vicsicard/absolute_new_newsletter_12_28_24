# Vercel Deployment Guide

This document contains important information and best practices for deploying our Next.js newsletter application to Vercel.

## Table of Contents
1. [Environment Variables](#environment-variables)
2. [Build Configuration](#build-configuration)
3. [API Routes & Serverless Functions](#api-routes--serverless-functions)
4. [Database Connections](#database-connections)
5. [Performance Optimization](#performance-optimization)
6. [Troubleshooting](#troubleshooting)

## Environment Variables

Required environment variables for production:

```env
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=
```

Note: Ensure all environment variables are properly set in the Vercel dashboard under Project Settings > Environment Variables.

## Build Configuration

### Node.js Version
- Required: Node.js 18.18 or later
- Set in package.json:
  ```json
  {
    "engines": {
      "node": ">=18.0.0"
    }
  }
  ```

### Build Settings
- Output: Server-side rendering (SSR)
- Framework Preset: Next.js
- Build Command: `next build`
- Install Command: `npm install`
- Output Directory: `.next`

## API Routes & Serverless Functions

Our application uses the following API routes:

1. `/api/newsletter/send` - Handles newsletter sending
   - Method: POST
   - Runtime: Node.js
   - Memory: 1024 MB
   - Timeout: 60s

2. `/api/onboarding` - Handles company onboarding
   - Method: POST
   - Runtime: Node.js
   - Memory: 1024 MB
   - Timeout: 60s

## Database Connections

### Supabase Configuration
- Connection pooling is enabled
- Edge functions are configured to run in regions close to the database
- Proper connection string format:
  ```
  postgresql://[user]:[password]@[host]:[port]/[database]
  ```

### Connection Management
- Using connection pooling for optimal performance
- Implementing proper error handling and retries
- Monitoring connection limits and usage

## Performance Optimization

1. **Image Optimization**
   - Using next/image for automatic optimization
   - Implementing proper caching headers
   - Using appropriate image formats (WebP, AVIF)

2. **API Route Optimization**
   - Implementing proper caching strategies
   - Using edge functions where appropriate
   - Optimizing database queries

3. **Build Optimization**
   - Minimizing bundle size
   - Implementing code splitting
   - Using dynamic imports for large dependencies

## Troubleshooting

Common issues and solutions:

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime Errors**
   - Verify environment variables are set
   - Check API route timeouts
   - Monitor database connection issues

3. **Performance Issues**
   - Monitor Edge Function performance
   - Check database query performance
   - Verify image optimization settings

For additional support, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)

---
*This document will be updated with Vercel deployment documentation and best practices.*

When it comes to deploying a Next.js application, there are several important configuration requirements and considerations to keep in mind. Here are the key deployment configuration requirements for Next.js:
Node.js Version: Next.js requires Node.js 18.18 or later 1 .
Package.json Configuration: Ensure your package.json file includes the necessary scripts for deployment: jso { "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "lint": "next lint" } }
Build Process: Run next build to generate an optimized version of your application for production 2 .
Static Assets: If you're using static assets, make sure to place them in the public folder at the root of your project 1 .
Environment Variables: Configure your environment variables properly. For runtime environment variables, prefix them with NEXT_PUBLIC_ to expose them to the browser 5 .
Image Optimization: If you're using next/image for image optimization, ensure your next.config.js is properly configured, especially if you're using a custom image loader 2 .
Middleware: If your application uses Middleware, ensure it's properly set up. Middleware requires access to the incoming request and is not supported in static exports 2 .
Server Configuration: If you're self-hosting, make sure your server is configured to run a Node.js environment and that you've set up the necessary build and start scripts 2 .
Docker Support: If you're using Docker, ensure your Dockerfile is properly set up to build and run your Next.js application 2 .
Vercel Deployment: If you're using Vercel for deployment, make sure your project is connected to your Vercel account, and the necessary configurations are set up in the Vercel dashboard 2 .
Performance Optimization: Consider implementing performance optimizations like enabling React 18's concurrent features, using server components where appropriate, and implementing proper caching strategies 2 .
Error Handling: Set up proper error handling and logging mechanisms to capture and address any issues that may arise in production 2 .
Remember that while these are general requirements, the specific configuration may vary depending on your application's needs and the deployment method you choose. Always refer to the official Next.js documentation for the most up-to-date and detailed information regarding deployment 1 2 5 .
API routes and serverless functions

API routes and serverless functions are two powerful features in Next.js that allow you to build server-side functionality within your application. Let's explore each of them in detail:

API Routes:
API routes in Next.js provide a way to create API endpoints within your application. They are server-side only bundles and won't increase your client-side bundle size 4 .

Key points about API routes:

Location: API routes are created in the pages/api directory or src/pages/api if you're using the src directory structure 4 .
File Structure: Each file in the api directory is mapped to /api/* and treated as an API endpoint 4 .
Request Handling: API routes can handle different HTTP methods (GET, POST, PUT, DELETE, etc.) using req.method4 .
Built-in Helpers: They provide built-in request helpers like req.cookies, req.query, and req.body4 .
Custom Config: You can export a config object to change the default configuration, such as disabling the automatic body parsing 4 .
Response Helpers: API routes include Express.js-like helper methods for creating responses, such as res.status(), res.json(), and res.redirect()4 .
Here's a simple example of an API route:


// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}
Serverless Functions:
Serverless functions are a more general concept that can be used with various frameworks, including Next.js. They allow you to run backend code without managing servers 5 .

Key points about serverless functions:

Bundling: Vercel uses a process to bundle as many routes as possible into a single Serverless Function 5 .
Configuration: You can use the functions property in your vercel.json file to define the configuration for a route 5 .
Memory and Duration: You can configure the amount of memory and maximum duration for each function 5 .
Cold Starts: Serverless functions may experience cold starts, which can affect performance 5 .
Multiple Regions: It's possible to deploy Serverless Functions to multiple regions, but this feature is only available to Enterprise teams 5 .
While API routes are specific to Next.js, serverless functions can be used with any framework that supports serverless architecture. In the context of Next.js, API routes are essentially a specialized form of serverless functions.

Here's an example of how you might configure a serverless function in Vercel:


{
  "functions": {
    "api/hello.js": {
      "memory": 3009,
      "maxDuration": 60
    }
  }
}
In this example, the hello.js function is configured to use 3009MB of memory and has a maximum duration of 60 seconds.

It's important to note that while API routes and serverless functions offer great flexibility and scalability, they also come with some considerations:

Cold starts can introduce latency, especially for infrequently used functions.
You need to manage the function's lifecycle, including handling timeouts and errors.
There's often a limit on the maximum execution time and memory usage for each function.
When deciding between using API routes and serverless functions, consider the specific needs of your application, such as the complexity of the backend logic, the expected traffic, and the deployment environment 5 .

Resources
How can I increase the limit of redirects or use dynamic redirects on Vercel?

Error List

Building Your Application: Deploying | Next.js

Routing: API Routes | Next.js

Functions Concepts

Next.js deployment configuration requirements

When it comes to deploying a Next.js application, there are several important configuration requirements and considerations to keep in mind. Here are the key deployment configuration requirements for Next.js:

Node.js Version: Next.js requires Node.js 18.18 or later 1 .

Package.json Configuration: Ensure your package.json file includes the necessary scripts for deployment: jso { "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "lint": "next lint" } }

Build Process: Run next build to generate an optimized version of your application for production 2 .

Static Assets: If you're using static assets, make sure to place them in the public folder at the root of your project 1 .

Environment Variables: Configure your environment variables properly. For runtime environment variables, prefix them with NEXT_PUBLIC_ to expose them to the browser 5 .

Image Optimization: If you're using next/image for image optimization, ensure your next.config.js is properly configured, especially if you're using a custom image loader 2 .

Middleware: If your application uses Middleware, ensure it's properly set up. Middleware requires access to the incoming request and is not supported in static exports 2 .

Server Configuration: If you're self-hosting, make sure your server is configured to run a Node.js environment and that you've set up the necessary build and start scripts 2 .

Docker Support: If you're using Docker, ensure your Dockerfile is properly set up to build and run your Next.js application 2 .

Vercel Deployment: If you're using Vercel for deployment, make sure your project is connected to your Vercel account, and the necessary configurations are set up in the Vercel dashboard 2 .

Performance Optimization: Consider implementing performance optimizations like enabling React 18's concurrent features, using server components where appropriate, and implementing proper caching strategies 2 .

Error Handling: Set up proper error handling and logging mechanisms to capture and address any issues that may arise in production 2 .

Remember that while these are general requirements, the specific configuration may vary depending on your application's needs and the deployment method you choose. Always refer to the official Next.js documentation for the most up-to-date and detailed information regarding deployment 1 2 5 .

Deploying
Congratulations, it's time to ship to production.

You can deploy managed Next.js with Vercel, or self-host on a Node.js server, Docker image, or even static HTML files. When deploying using next start, all Next.js features are supported.

Production Builds
Running next build generates an optimized version of your application for production. HTML, CSS, and JavaScript files are created based on your pages. JavaScript is compiled and browser bundles are minified using the Next.js Compiler to help achieve the best performance and support all modern browsers.

Next.js produces a standard deployment output used by managed and self-hosted Next.js. This ensures all features are supported across both methods of deployment. In the next major version, we will be transforming this output into our Build Output API specification.

Managed Next.js with Vercel
Vercel, the creators and maintainers of Next.js, provide managed infrastructure and a developer experience platform for your Next.js applications.

Deploying to Vercel is zero-configuration and provides additional enhancements for scalability, availability, and performance globally. However, all Next.js features are still supported when self-hosted.

Learn more about Next.js on Vercel or deploy a template for free to try it out.

Self-Hosting
You can self-host Next.js in three different ways:

A Node.js server
A Docker container
A static export
🎥 Watch: Learn more about self-hosting Next.js → YouTube (45 minutes).

We have community maintained deployment examples with the following providers:

Deno
DigitalOcean
Flightcontrol
Fly.io
GitHub Pages
Google Cloud Run
Railway
Render
SST
Node.js Server
Next.js can be deployed to any hosting provider that supports Node.js. Ensure your package.json has the "build" and "start" scripts:

package.json

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
Then, run npm run build to build your application. Finally, run npm run start to start the Node.js server. This server supports all Next.js features.

Docker Image
Next.js can be deployed to any hosting provider that supports Docker containers. You can use this approach when deploying to container orchestrators such as Kubernetes or when running inside a container in any cloud provider.

Install Docker on your machine
Clone our example (or the multi-environment example)
Build your container: docker build -t nextjs-docker .
Run your container: docker run -p 3000:3000 nextjs-docker
Next.js through Docker supports all Next.js features.

Static HTML Export
Next.js enables starting as a static site or Single-Page Application (SPA), then later optionally upgrading to use features that require a server.

Since Next.js supports this static export, it can be deployed and hosted on any web server that can serve HTML/CSS/JS static assets. This includes tools like AWS S3, Nginx, or Apache.

Running as a static export does not support Next.js features that require a server. Learn more.

Good to know:

Server Components are supported with static exports.
Features
Image Optimization
Image Optimization through next/image works self-hosted with zero configuration when deploying using next start. If you would prefer to have a separate service to optimize images, you can configure an image loader.

Image Optimization can be used with a static export by defining a custom image loader in next.config.js. Note that images are optimized at runtime, not during the build.

Good to know:

On glibc-based Linux systems, Image Optimization may require additional configuration to prevent excessive memory usage.
Learn more about the caching behavior of optimized images and how to configure the TTL.
You can also disable Image Optimization and still retain other benefits of using next/image if you prefer. For example, if you are optimizing images yourself separately.
Middleware
Middleware works self-hosted with zero configuration when deploying using next start. Since it requires access to the incoming request, it is not supported when using a static export.

Middleware uses a runtime that is a subset of all available Node.js APIs to help ensure low latency, since it may run in front of every route or asset in your application. This runtime does not require running “at the edge” and works in a single-region server. Additional configuration and infrastructure are required to run Middleware in multiple regions.

If you are looking to add logic (or use an external package) that requires all Node.js APIs, you might be able to move this logic to a layout as a Server Component. For example, checking headers and redirecting. You can also use headers, cookies, or query parameters to redirect or rewrite through next.config.js. If that does not work, you can also use a custom server.

Environment Variables
Next.js can support both build time and runtime environment variables.

By default, environment variables are only available on the server. To expose an environment variable to the browser, it must be prefixed with NEXT_PUBLIC_. However, these public environment variables will be inlined into the JavaScript bundle during next build.

You safely read environment variables on the server during dynamic rendering.

app/page.ts
TypeScript

TypeScript

import { connection } from 'next/server'
 
export default async function Component() {
  await connection()
  // cookies, headers, and other Dynamic APIs
  // will also opt into dynamic rendering, meaning
  // this env variable is evaluated at runtime
  const value = process.env.MY_VALUE
  // ...
}
This allows you to use a singular Docker image that can be promoted through multiple environments with different values.

Good to know:

You can run code on server startup using the register function.
We do not recommend using the runtimeConfig option, as this does not work with the standalone output mode. Instead, we recommend incrementally adopting the App Router.
Caching and ISR
Next.js can cache responses, generated static pages, build outputs, and other static assets like images, fonts, and scripts.

Caching and revalidating pages (with Incremental Static Regeneration) use the same shared cache. By default, this cache is stored to the filesystem (on disk) on your Next.js server. This works automatically when self-hosting using both the Pages and App Router.

You can configure the Next.js cache location if you want to persist cached pages and data to durable storage, or share the cache across multiple containers or instances of your Next.js application.

Automatic Caching
Next.js sets the Cache-Control header of public, max-age=31536000, immutable to truly immutable assets. It cannot be overridden. These immutable files contain a SHA-hash in the file name, so they can be safely cached indefinitely. For example, Static Image Imports. You can configure the TTL for images.
Incremental Static Regeneration (ISR) sets the Cache-Control header of s-maxage: <revalidate in getStaticProps>, stale-while-revalidate. This revalidation time is defined in your getStaticProps function in seconds. If you set revalidate: false, it will default to a one-year cache duration.
Dynamically rendered pages set a Cache-Control header of private, no-cache, no-store, max-age=0, must-revalidate to prevent user-specific data from being cached. This applies to both the App Router and Pages Router. This also includes Draft Mode.
Static Assets
If you want to host static assets on a different domain or CDN, you can use the assetPrefix configuration in next.config.js. Next.js will use this asset prefix when retrieving JavaScript or CSS files. Separating your assets to a different domain does come with the downside of extra time spent on DNS and TLS resolution.

Learn more about assetPrefix.

Configuring Caching
By default, generated cache assets will be stored in memory (defaults to 50mb) and on disk. If you are hosting Next.js using a container orchestration platform like Kubernetes, each pod will have a copy of the cache. To prevent stale data from being shown since the cache is not shared between pods by default, you can configure the Next.js cache to provide a cache handler and disable in-memory caching.

To configure the ISR/Data Cache location when self-hosting, you can configure a custom handler in your next.config.js file:

next.config.js

module.exports = {
  cacheHandler: require.resolve('./cache-handler.js'),
  cacheMaxMemorySize: 0, // disable default in-memory caching
}
Then, create cache-handler.js in the root of your project, for example:

cache-handler.js

const cache = new Map()
 
module.exports = class CacheHandler {
  constructor(options) {
    this.options = options
  }
 
  async get(key) {
    // This could be stored anywhere, like durable storage
    return cache.get(key)
  }
 
  async set(key, data, ctx) {
    // This could be stored anywhere, like durable storage
    cache.set(key, {
      value: data,
      lastModified: Date.now(),
      tags: ctx.tags,
    })
  }
 
  async revalidateTag(tags) {
    // tags is either a string or an array of strings
    tags = [tags].flat()
    // Iterate over all entries in the cache
    for (let [key, value] of cache) {
      // If the value's tags include the specified tag, delete this entry
      if (value.tags.some((tag) => tags.includes(tag))) {
        cache.delete(key)
      }
    }
  }
 
  // If you want to have temporary in memory cache for a single request that is reset
  // before the next request you can leverage this method
  public resetRequestCache() {}
}
Using a custom cache handler will allow you to ensure consistency across all pods hosting your Next.js application. For instance, you can save the cached values anywhere, like Redis or AWS S3.

Good to know:

revalidatePath is a convenience layer on top of cache tags. Calling revalidatePath will call the revalidateTag function with a special default tag for the provided page.
Build Cache
Next.js generates an ID during next build to identify which version of your application is being served. The same build should be used and boot up multiple containers.

If you are rebuilding for each stage of your environment, you will need to generate a consistent build ID to use between containers. Use the generateBuildId command in next.config.js:

next.config.js

module.exports = {
  generateBuildId: async () => {
    // This could be anything, using the latest git hash
    return process.env.GIT_HASH
  },
}
Version Skew
Next.js will automatically mitigate most instances of version skew and automatically reload the application to retrieve new assets when detected. For example, if there is a mismatch in the deploymentId, transitions between pages will perform a hard navigation versus using a prefetched value.

When the application is reloaded, there may be a loss of application state if it's not designed to persist between page navigations. For example, using URL state or local storage would persist state after a page refresh. However, component state like useState would be lost in such navigations.

Vercel provides additional skew protection for Next.js applications to ensure assets and functions from the previous version are still available to older clients, even after the new version is deployed.

You can manually configure the deploymentId property in your next.config.js file to ensure each request uses either ?dpl query string or x-deployment-id header.

Streaming and Suspense
The Next.js App Router supports streaming responses when self-hosting. If you are using Nginx or a similar proxy, you will need to configure it to disable buffering to enable streaming.

For example, you can disable buffering in Nginx by setting X-Accel-Buffering to no:

next.config.js

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*{/}?',
        headers: [
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
        ],
      },
    ]
  },
}
Partial Prerendering
Partial Prerendering (experimental) works by default with Next.js and is not a CDN feature. This includes deployment as a Node.js server (through next start) and when used with a Docker container.

Usage with CDNs
When using a CDN in front on your Next.js application, the page will include Cache-Control: private response header when dynamic APIs are accessed. This ensures that the resulting HTML page is marked as non-cachable. If the page is fully prerendered to static, it will include Cache-Control: public to allow the page to be cached on the CDN.

If you don't need a mix of both static and dynamic components, you can make your entire route static and cache the output HTML on a CDN. This Automatic Static Optimization is the default behavior when running next build if dynamic APIs are not used.

after
after is fully supported when self-hosting with next start.

When stopping the server, ensure a graceful shutdown by sending SIGINT or SIGTERM signals and waiting. This allows the Next.js server to wait until after pending callback functions or promises used inside after have finished.

If you want to use after on custom infrastructure, check your provider documentation to view support for after.
Using after in a serverless context requires waiting for asynchronous tasks to finish after the response has been sent. In Next.js and Vercel, this is achieved using a primitive called waitUntil(promise), which extends the lifetime of a serverless invocation until all promises passed to waitUntil have settled.

If you want your users to be able to run after, you will have to provide your implementation of waitUntil that behaves in an analogous way.

When after is called, Next.js will access waitUntil like this:


const RequestContext = globalThis[Symbol.for('@next/request-context')]
const contextValue = RequestContext?.get()
const waitUntil = contextValue?.waitUntil
Which means that globalThis[Symbol.for('@next/request-context')] is expected to contain an object like this:


type NextRequestContext = {
  get(): NextRequestContextValue | undefined
}
 
type NextRequestContextValue = {
  waitUntil?: (promise: Promise<any>) => void
}
Here is an example of the implementation.


import { AsyncLocalStorage } from 'node:async_hooks'
 
const RequestContextStorage = new AsyncLocalStorage<NextRequestContextValue>()
 
// Define and inject the accessor that next.js will use
const RequestContext: NextRequestContext = {
  get() {
    return RequestContextStorage.getStore()
  },
}
globalThis[Symbol.for('@next/request-context')] = RequestContext
 
const handler = (req, res) => {
  const contextValue = { waitUntil: YOUR_WAITUNTIL }
  // Provide the value
  return RequestContextStorage.run(contextValue, () => nextJsHandler(req, res))
}
When it comes to building and optimizing a Next.js application for deployment, there are several important settings and strategies to consider. Let's go through the key build settings and optimization techniques:

Build Settings:

a. next.config.js: The next.config.js file is where you can customize your Next.js build settings. It's a Node.js module that gets used by the Next.js server during the build and runtime phases 3】.

Example: ```javascrip / @type {import('next').NextConfig} */ const nextConfig = { reactStrictMode: true, swcMinify: true, images: { domains: ['example.com'], }, }

module.exports = nextConfig ```

b. TypeScript: If you're using TypeScript, you can use next.config.ts for your configuration file 3】.

c. Environment Variables: Next.js allows you to define environment variables in your next.config.js file, which can be accessed at build time 3】.

Optimization Techniques:

a. Automatic Static Optimization: Next.js automatically optimizes pages that don't require server-side rendering, serving them as static HTML 2】.

b. Image Optimization: Next.js provides an Image Component (next/image) that automatically optimizes images on-demand for different screen sizes and resolutions 2】.

c. Code Splitting: Next.js automatically splits your code into smaller chunks, loading only the necessary JavaScript for each page 2】.

d. Server Components: Utilizing React Server Components can significantly reduce the amount of JavaScript sent to the client, improving performance 2】.

e. Middleware: Next.js Middleware allows you to run code before a request is completed, which can be used for tasks like authentication, redirects, and more 2】.

Performance Optimization:

a. React 18 Features: Next.js supports React 18 features like automatic batching, transitions, and streaming server rendering, which can greatly improve performance 2】.

b. Caching: Implementing proper caching strategies, both on the client-side and server-side, can significantly improve load times and reduce server load 2】.

c. Bundle Analysis: Using tools like next-bundle-analyzer can help you identify large dependencies and optimize your bundle size 2】.

Deployment Considerations:

a. Vercel: If you're deploying on Vercel, many optimizations are handled automatically. Vercel provides features like edge caching, automatic HTTPS, and serverless functions 2】.

b. Custom Server: If you're using a custom server, ensure it's properly configured to handle Next.js routes and static assets 2】.

c. Docker: If you're using Docker for deployment, make sure your Dockerfile is optimized for Next.js applications, using multi-stage builds to reduce image size 2】.

Security:

a. Content Security Policy (CSP): Implementing a strong CSP can help prevent cross-site scripting (XSS) attacks 2】.

b. HTTP Headers: Configure proper HTTP headers like X-Frame-Options, X-Content-Type-Options, and others to enhance security 2】.

Accessibility:

a. Semantic HTML: Ensure your application uses semantic HTML, which not only helps with SEO but also improves accessibility 2】.

b. ARIA Attributes: Use ARIA attributes where necessary to improve accessibility for users with disabilities 2】.

Remember that optimization is an ongoing process. Regularly monitor your application's performance and make adjustments as needed. Tools like Google Lighthouse can help you identify areas for improvement 2】.

Resources
API Reference: Configuration | Next.js

Functions Concepts

Configuration: next.config.js Options | Next.js

API Reference: next.config.js Options | Next.js

Configuring a Build

API routes and serverless functions

API routes and serverless functions are two powerful features in Next.js that allow you to build server-side functionality within your application. Let's explore each of them in detail:

API Routes:
API routes in Next.js provide a way to create API endpoints within your application. They are server-side only bundles and won't increase your client-side bundle size 4 .

Key points about API routes:

Location: API routes are created in the pages/api directory or src/pages/api if you're using the src directory structure 4 .
File Structure: Each file in the api directory is mapped to /api/* and treated as an API endpoint 4 .
Request Handling: API routes can handle different HTTP methods (GET, POST, PUT, DELETE, etc.) using req.method4 .
Built-in Helpers: They provide built-in request helpers like req.cookies, req.query, and req.body4 .
Custom Config: You can export a config object to change the default configuration, such as disabling the automatic body parsing 4 .
Response Helpers: API routes include Express.js-like helper methods for creating responses, such as res.status(), res.json(), and res.redirect()4 .
Here's a simple example of an API route:


// pages/api/hello.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}
Serverless Functions:
Serverless functions are a more general concept that can be used with various frameworks, including Next.js. They allow you to run backend code without managing servers 5 .

Key points about serverless functions:

Bundling: Vercel uses a process to bundle as many routes as possible into a single Serverless Function 5 .
Configuration: You can use the functions property in your vercel.json file to define the configuration for a route 5 .
Memory and Duration: You can configure the amount of memory and maximum duration for each function 5 .
Cold Starts: Serverless functions may experience cold starts, which can affect performance 5 .
Multiple Regions: It's possible to deploy Serverless Functions to multiple regions, but this feature is only available to Enterprise teams 5 .
While API routes are specific to Next.js, serverless functions can be used with any framework that supports serverless architecture. In the context of Next.js, API routes are essentially a specialized form of serverless functions.

Here's an example of how you might configure a serverless function in Vercel:


{
  "functions": {
    "api/hello.js": {
      "memory": 3009,
      "maxDuration": 60
    }
  }
}
In this example, the hello.js function is configured to use 3009MB of memory and has a maximum duration of 60 seconds.

It's important to note that while API routes and serverless functions offer great flexibility and scalability, they also come with some considerations:

Cold starts can introduce latency, especially for infrequently used functions.
You need to manage the function's lifecycle, including handling timeouts and errors.
There's often a limit on the maximum execution time and memory usage for each function.
When deciding between using API routes and serverless functions, consider the specific needs of your application, such as the complexity of the backend logic, the expected traffic, and the deployment environment 5 .

Resources
How can I increase the limit of redirects or use dynamic redirects on Vercel?

Error List

Building Your Application: Deploying | Next.js

Routing: API Routes | Next.js

Functions Concepts

Next.js deployment configuration requirements

When it comes to deploying a Next.js application, there are several important configuration requirements and considerations to keep in mind. Here are the key deployment configuration requirements for Next.js:

Node.js Version: Next.js requires Node.js 18.18 or later 1 .

Package.json Configuration: Ensure your package.json file includes the necessary scripts for deployment: jso { "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "lint": "next lint" } }

Build Process: Run next build to generate an optimized version of your application for production 2 .

Static Assets: If you're using static assets, make sure to place them in the public folder at the root of your project 1 .

Environment Variables: Configure your environment variables properly. For runtime environment variables, prefix them with NEXT_PUBLIC_ to expose them to the browser 5 .

Image Optimization: If you're using next/image for image optimization, ensure your next.config.js is properly configured, especially if you're using a custom image loader 2 .

Middleware: If your application uses Middleware, ensure it's properly set up. Middleware requires access to the incoming request and is not supported in static exports 2 .

Server Configuration: If you're self-hosting, make sure your server is configured to run a Node.js environment and that you've set up the necessary build and start scripts 2 .

Docker Support: If you're using Docker, ensure your Dockerfile is properly set up to build and run your Next.js application 2 .

Vercel Deployment: If you're using Vercel for deployment, make sure your project is connected to your Vercel account, and the necessary configurations are set up in the Vercel dashboard 2 .

Performance Optimization: Consider implementing performance optimizations like enabling React 18's concurrent features, using server components where appropriate, and implementing proper caching strategies 2 .

Error Handling: Set up proper error handling and logging mechanisms to capture and address any issues that may arise in production 2 .

Remember that while these are general requirements, the specific configuration may vary depending on your application's needs and the deployment method you choose. Always refer to the official Next.js documentation for the most up-to-date and detailed information regarding deployment 1 2 5 .
Environment Variables
Next.js comes with built-in support for environment variables, which allows you to do the following:

Use .env to load environment variables
Bundle environment variables for the browser by prefixing with NEXT_PUBLIC_
Loading Environment Variables
Next.js has built-in support for loading environment variables from .env* files into process.env.

.env

DB_HOST=localhost
DB_USER=myuser
DB_PASS=mypassword
Note: Next.js also supports multiline variables inside of your .env* files:


# .env
 
# you can write with line breaks
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
Kh9NV...
...
-----END DSA PRIVATE KEY-----"
 
# or with `\n` inside double quotes
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nKh9NV...\n-----END DSA PRIVATE KEY-----\n"
Note: If you are using a /src folder, please note that Next.js will load the .env files only from the parent folder and not from the /src folder. This loads process.env.DB_HOST, process.env.DB_USER, and process.env.DB_PASS into the Node.js environment automatically allowing you to use them in Route Handlers.

For example:

app/api/route.js

export async function GET() {
  const db = await myDB.connect({
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
  })
  // ...
}
Loading Environment Variables with @next/env
If you need to load environment variables outside of the Next.js runtime, such as in a root config file for an ORM or test runner, you can use the @next/env package.

This package is used internally by Next.js to load environment variables from .env* files.

To use it, install the package and use the loadEnvConfig function to load the environment variables:


npm install @next/env
envConfig.ts
TypeScript

TypeScript

import { loadEnvConfig } from '@next/env'
 
const projectDir = process.cwd()
loadEnvConfig(projectDir)
Then, you can import the configuration where needed. For example:

orm.config.ts
TypeScript

TypeScript

import './envConfig.ts'
 
export default defineConfig({
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
})
Referencing Other Variables
Next.js will automatically expand variables that use $ to reference other variables e.g. $VARIABLE inside of your .env* files. This allows you to reference other secrets. For example:

.env

TWITTER_USER=nextjs
TWITTER_URL=https://x.com/$TWITTER_USER
In the above example, process.env.TWITTER_URL would be set to https://x.com/nextjs.

Good to know: If you need to use variable with a $ in the actual value, it needs to be escaped e.g. \$.

Bundling Environment Variables for the Browser
Non-NEXT_PUBLIC_ environment variables are only available in the Node.js environment, meaning they aren't accessible to the browser (the client runs in a different environment).

In order to make the value of an environment variable accessible in the browser, Next.js can "inline" a value, at build time, into the js bundle that is delivered to the client, replacing all references to process.env.[variable] with a hard-coded value. To tell it to do this, you just have to prefix the variable with NEXT_PUBLIC_. For example:

Terminal

NEXT_PUBLIC_ANALYTICS_ID=abcdefghijk
This will tell Next.js to replace all references to process.env.NEXT_PUBLIC_ANALYTICS_ID in the Node.js environment with the value from the environment in which you run next build, allowing you to use it anywhere in your code. It will be inlined into any JavaScript sent to the browser.

Note: After being built, your app will no longer respond to changes to these environment variables. For instance, if you use a Heroku pipeline to promote slugs built in one environment to another environment, or if you build and deploy a single Docker image to multiple environments, all NEXT_PUBLIC_ variables will be frozen with the value evaluated at build time, so these values need to be set appropriately when the project is built. If you need access to runtime environment values, you'll have to setup your own API to provide them to the client (either on demand or during initialization).

pages/index.js

import setupAnalyticsService from '../lib/my-analytics-service'
 
// 'NEXT_PUBLIC_ANALYTICS_ID' can be used here as it's prefixed by 'NEXT_PUBLIC_'.
// It will be transformed at build time to `setupAnalyticsService('abcdefghijk')`.
setupAnalyticsService(process.env.NEXT_PUBLIC_ANALYTICS_ID)
 
function HomePage() {
  return <h1>Hello World</h1>
}
 
export default HomePage
Note that dynamic lookups will not be inlined, such as:


// This will NOT be inlined, because it uses a variable
const varName = 'NEXT_PUBLIC_ANALYTICS_ID'
setupAnalyticsService(process.env[varName])
 
// This will NOT be inlined, because it uses a variable
const env = process.env
setupAnalyticsService(env.NEXT_PUBLIC_ANALYTICS_ID)
Runtime Environment Variables
Next.js can support both build time and runtime environment variables.

By default, environment variables are only available on the server. To expose an environment variable to the browser, it must be prefixed with NEXT_PUBLIC_. However, these public environment variables will be inlined into the JavaScript bundle during next build.

You can safely read environment variables on the server during dynamic rendering:

app/page.ts
TypeScript

TypeScript

import { connection } from 'next/server'
 
export default async function Component() {
  await connection()
  // cookies, headers, and other Dynamic APIs
  // will also opt into dynamic rendering, meaning
  // this env variable is evaluated at runtime
  const value = process.env.MY_VALUE
  // ...
}
This allows you to use a singular Docker image that can be promoted through multiple environments with different values.

Good to know:

You can run code on server startup using the register function.
We do not recommend using the runtimeConfig option, as this does not work with the standalone output mode. Instead, we recommend incrementally adopting the App Router.
Default Environment Variables
Typically, only .env* file is needed. However, sometimes you might want to add some defaults for the development (next dev) or production (next start) environment.

Next.js allows you to set defaults in .env (all environments), .env.development (development environment), and .env.production (production environment).

Good to know: .env, .env.development, and .env.production files should be included in your repository as they define defaults. All .env files are excluded in .gitignore by default, allowing you to opt-into committing these values to your repository.

Environment Variables on Vercel
When deploying your Next.js application to Vercel, Environment Variables can be configured in the Project Settings.

All types of Environment Variables should be configured there. Even Environment Variables used in Development – which can be downloaded onto your local device afterwards.

If you've configured Development Environment Variables you can pull them into a .env.local for usage on your local machine using the following command:

Terminal

vercel env pull
Good to know: When deploying your Next.js application to Vercel, your environment variables in .env* files will not be made available to Edge Runtime, unless their name are prefixed with NEXT_PUBLIC_. We strongly recommend managing your environment variables in Project Settings instead, from where all environment variables are available.

Test Environment Variables
Apart from development and production environments, there is a 3rd option available: test. In the same way you can set defaults for development or production environments, you can do the same with a .env.test file for the testing environment (though this one is not as common as the previous two). Next.js will not load environment variables from .env.development or .env.production in the testing environment.

This one is useful when running tests with tools like jest or cypress where you need to set specific environment vars only for testing purposes. Test default values will be loaded if NODE_ENV is set to test, though you usually don't need to do this manually as testing tools will address it for you.

There is a small difference between test environment, and both development and production that you need to bear in mind: .env.local won't be loaded, as you expect tests to produce the same results for everyone. This way every test execution will use the same env defaults across different executions by ignoring your .env.local (which is intended to override the default set).

Good to know: similar to Default Environment Variables, .env.test file should be included in your repository, but .env.test.local shouldn't, as .env*.local are intended to be ignored through .gitignore.

While running unit tests you can make sure to load your environment variables the same way Next.js does by leveraging the loadEnvConfig function from the @next/env package.


// The below can be used in a Jest global setup file or similar for your testing set-up
import { loadEnvConfig } from '@next/env'
 
export default async () => {
  const projectDir = process.cwd()
  loadEnvConfig(projectDir)
}
Environment Variable Load Order
Environment variables are looked up in the following places, in order, stopping once the variable is found.

process.env
.env.$(NODE_ENV).local
.env.local (Not checked when NODE_ENV is test.)
.env.$(NODE_ENV)
.env
For example, if NODE_ENV is development and you define a variable in both .env.development.local and .env, the value in .env.development.local will be used.

Good to know: The allowed values for NODE_ENV are production, development and test.

Good to know
If you are using a /src directory, .env.* files should remain in the root of your project.
If the environment variable NODE_ENV is unassigned, Next.js automatically assigns development when running the next dev command, or production for all other commands.
When handling database connections in production for a Next.js application, there are several best practices and recommendations to ensure optimal performance, security, and reliability. Here are some key recommendations:

Use Connection Pooling: Implement connection pooling to manage database connections efficiently. This allows you to reuse connections instead of constantly opening and closing them, which can be resource-intensive.

Here's an example using PostgreSQL with the pg library:


import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // close idle clients after 30 seconds
})

export async function query(text: string, params?: any[]) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  console.log('executed query', { text, duration, rows: res.rowCount })
  return res
}

export async function getClient() {
  return await pool.connect()
}
Use Environment Variables: Store sensitive information like database credentials in environment variables. This keeps them secure and allows for easy configuration changes between development and production environments.


DATABASE_URL=postgres://user:password@host:port/database
Implement Connection Timeouts: Set connection timeouts to prevent hanging connections and potential resource leaks.


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000, // 5 seconds
})
Use Serverless-Friendly Databases: If you're using a serverless architecture, consider using databases that are optimized for serverless environments, such as AWS Aurora Serverless or Google Cloud Spanner.

Implement Graceful Shutdown: Ensure your application properly closes database connections when shutting down to prevent data loss or corruption.


process.on('SIGINT', async () => {
  await pool.end()
  process.exit(0)
})
Use ORM or Query Builders: Consider using an Object-Relational Mapping (ORM) library or query builder to simplify database interactions and improve code maintainability. Examples include Prisma, TypeORM, or Knex.js.

Implement Connection Retry Logic: Add retry logic for database connections to handle transient errors gracefully.


async function connectWithRetry() {
  try {
    await pool.connect()
  } catch (err) {
    console.error('Failed to connect to database, retrying in 5 seconds...', err)
    setTimeout(connectWithRetry, 5000)
  }
}

connectWithRetry()
Use Read Replicas: If your application has high read traffic, consider using read replicas to distribute the load and improve performance.

Implement Proper Error Handling: Ensure you have robust error handling in place for database operations to prevent unhandled exceptions from crashing your application.

Monitor Database Performance: Use monitoring tools to keep an eye on your database performance, connection usage, and query execution times. This will help you identify and address potential issues before they impact your application.

Secure Database Connections: Use SSL/TLS for database connections to encrypt data in transit. Ensure your database is not publicly accessible and implement proper firewall rules.

Optimize Database Schema and Queries: Regularly review and optimize your database schema and queries to ensure efficient data access and storage.

By implementing these practices, you can ensure that your database connections are handled efficiently and securely in your Next.js production environment. Remember that database connection management is crucial for the overall performance and reliability of your application, so it's worth investing time and effort into implementing these best practices.

Functions Concepts
Table of Contents
Next.js (/app)
Functions and your data source
Functions should always execute close to where your data source is to reduce latency. By default, functions using the Node.js runtime execute in Washington, D.C., USA (iad1), a common location for external data sources. You can set a new default region through your project's settings on Vercel.

Edge Functions execute in the region closest to the user, which could result in longer response times when the function relies on a database located far away. For example, if a visitor triggers an Edge Function in Japan, but it depends on a database in San Francisco, the Function will have to send requests to and wait for a response from San Francisco for each call.

To avoid these long roundtrips, you can limit your Edge Functions to regions near your database, or you could use a globally-distributed database. Vercel's storage options allow you to determine the best location for your database.

Compute and Functions
“Compute” is an encompassing term used to describe the actions taken by a computer. In the context of web development and Vercel, we use compute to describe actions such as (but not limited to) building and rendering - essential operations needed to turn your code into a site that appears for users. It's often used to describe the work that functions do to create dynamic content on your page.

Functions lifecycle
Serverless Functions, usually execute in one specified region (although this can be configured), and allow you to write small chunks of code to provide additional functionality in your application, such as handle authentication, stream data, and make database queries.

When a user makes a request to your site, a serverless function will run on-demand, without you needing to manage the infrastructure, provision servers, or upgrade hardware.

With Vercel, for each incoming request to a serverless function, a new invocation happens.

If a request is received shortly after a function is executed, Vercel optimizes performance by reusing that function for the subsequent invocation. Over time, only as many functions as necessary are kept active to accommodate incoming traffic.

In the absence of additional incoming traffic, functions on Vercel will scale down to zero.

Cold and Hot Boots
A cold boot refers to a function starting from scratch. In contrast, a warm boot implies reusing a function, in which the underlying container that hosts it does not get discarded. State, such as temporary files, memory caches, sub-processes, is preserved. This empowers the developer not just to minimize the time spent in the booting process, but to also take advantage of caching data (in memory or filesystem) and memoizing expensive computations.

It's crucial to note that functions must not leave tasks running post-response, even during a hot state. If a sub-process is running by the time the response is returned, the entire container is frozen. When a new invocation happens, if the container is re-used, it is unfrozen, which allows sub-processes to continue running.

Advanced Usage
For an advanced configuration, you can create a vercel.json file to use Runtimes and other customizations. To view more about the properties you can customize, see the Configuring Functions and Project config with vercel.json.

If your use case requires that you work asynchronously with the results of a function invocation, you may need to consider a queuing, pooling, or streaming approach because of how serverless functions are created on Vercel.

Improving Function performance
The following suggestions will help you ensure optimal performance of your Vercel Functions:

Choose the correct region for your functions: All customers can change the default region for their functions in their project settings. Choose a region that's closest to your data source for optimal performance. See Functions and your data source for more information
Choose smaller dependencies inside your functions: Cold start times are correlated to function size, which is often mostly from external dependencies. If you have large dependencies, parsing and evaluating JavaScript code can take 3-5 seconds or longer. Review your bundle and try to eliminate larger dependencies using a bundle analyzer
Use proper caching headers: Function responses can be cached using Cache-Control headers. This will help ensure optimal performance for repeat visitors, and Vercel's Edge cache even supports stale-while-revalidate headers. Note that cache misses will still need to request data from your origin (e.g. database) rather than reading directly from the Edge cache (faster)
For more information see How can I improve serverless function cold start performance on Vercel?

Adding utility files to the /api directory
Sometimes, you need to place extra code files, such as utils.js or my-types.d.ts, inside the /api folder. To avoid turning these files into functions, Vercel ignores files with the following characters:

Files that start with an underscore, _
Files that start with .
Files that end with .d.ts
If your file uses any of the above, it will not be turned into a function.

Bundling Serverless Functions
In order to optimize resources, Vercel uses a process to bundle as many routes as possible into a single Serverless Function.

To provide more control over the bundling process, you can use the functions property in your vercel.json file to define the configuration for a route. If a configuration is present, Vercel will bundle functions based on the configuration first. Vercel will then bundle together the remaining routes, optimizing for how many functions are created.

This bundling process is currently only enabled for Next.js, but it will be enabled in other scenarios in the future.

In the following example, app/api/hello/route.ts will be bundled separately from app/api/another/route.ts since each has a different configuration:

Next.js (/app)
Next.js (/pages)
Other frameworks
vercel.json
TypeScript

TypeScript

{
  "functions": {
    "app/api/hello/route.ts": {
      "memory": 3009,
      "maxDuration": 60
    },
    "app/api/another/route.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}

How do I bypass the 4.5MB body size limit of Vercel Serverless Functions?
Learn how to deal with the body size limit of Serverless Functions on Vercel.
Last updated on June 25, 2024
Functions
Limits, Usage and Pricing
When trying to request or upload a large file from a Serverless Function, you may have seen a 413: FUNCTION_PAYLOAD_TOO_LARGE error. There are a few reasons why this error can occur, based on the following limits:

Limit

Streaming functions

Non-streaming functions

Request Body

4.5 MB

4.5 MB

Response Body

No limit

4.5 MB

To understand your function, you may first want to measure the response body size.

If the request body is too large:
This is when the body sent from the user/client to the serverless function exceeds the 4.5 MB limit.
The most common reason why this happens is when you are uploading large files. Instead, you may want to upload directly to the source.
If the response body is too large:
This is the body returned by a function to reply to the user/client. This may also appear as a 500 - FUNCTION RESPONSE PAYLOAD TOO LARGE error.
You can reduce the amount of data being returned per request.
Often, it can be hard or impossible for you to reduce the size of it depending on your needs. In this case, we recommend using streaming functions, which don't have this limit. See streaming functions for more information.
You may also want to request directly from the source.
Measure response body size
To understand how to optimize your function, you first need to know how large its response is.

Local testing
The most efficient way to measure the size of a function response body is to test locally. Perform a local build using production data or environment variables to ensure that the volume of data that the function handles closely matches production.

Once the build is complete, start the local server with pnpm start and then use curl to get the response size of a given route:


curl localhost:3000/your/page -w '%{size_download}'
You can also see this within Chrome DevTools under the Network tab. However, note that by default this will show you the gzipped size. To see the true size, enable Big Request Mode.

Reducing response size
The best way to avoid the 413 error is to reduce the amount of data being returned per function request. For example, filter for more specific data, such as 10 products instead of all products. You could also refactor large pages into smaller parallel routes, each fetching their data independently.

Streaming responses
If reducing the response size is not feasible, consider streaming your function responses. For customers using Next.js, refer to the official Next.js documentation for further guidance on streaming.

Request directly from the source
Serverless Functions are designed to respond quickly to clients and should be treated like a lightweight API layer, not a media server.

If you have a large file like a video that you need to send to a client, you should consider storing those assets in a dedicated media host and making them retrievable with a pre-signed URL that contains access control policies directly in the URL.

This will ensure that your assets are securely accessed in a manner that you control. Cloudinary, FaunaDB, and AWS S3 are all examples of services that support this.

Upload directly to the source
Similar to requesting assets securely, you can upload large files directly to a media host from your browser without needing a Serverless Function as a proxy. Vercel Blob, Cloudinary, FaunaDB, and AWS S3 are all solutions for this among others.

If you need to upload files larger than 4.5 MB to Vercel Blob, you can use client uploads, where the file is sent directly from the client (e.g. a browser) to Vercel Blob. This transfer is done securely so as not to expose your Vercel Blob store to anonymous uploads. The security mechanism is based on a token exchange between your server and Vercel Blob. Use the following steps to achieve this:

Step 1: Create a client upload page
This page allows you to upload files to Vercel Blob. The files will go directly from the browser to Vercel Blob without going through your server. Behind the scenes, the upload is done securely by exchanging a token with your server before uploading the file.

app/avatar/upload/page.tsx

'use client';
 
import { type PutBlobResult } from '@vercel/blob';
import { upload } from '@vercel/blob/client';
import { useState, useRef } from 'react';
 
export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult | null>(null);
  return (
    <>
      <h1>Upload Your Avatar</h1>
 
      <form
        onSubmit={async (event) => {
          event.preventDefault();
 
          const file = inputFileRef.current.files[0];
 
          const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/avatar/upload',
          });
 
          setBlob(newBlob);
        }}
      >
        <input name="file" ref={inputFileRef} type="file" required />
        <button type="submit">Upload</button>
      </form>
      {blob && (
        <div>
          Blob url: <a href={blob.url}>{blob.url}</a>
        </div>
      )}
    </>
  );
}
Step 2: Create a client upload route
The responsibility of this client upload route is to:

Generate tokens for client uploads
Listen for completed client uploads, so you can update your database with the URL of the uploaded file for example
The @vercel/blob npm package exposes a helper to implement said responsibilities.

app/api/avatar/upload/route.ts

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
 
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
 
  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (
        pathname: string,
        /* clientPayload?: string, */
      ) => {
        // Generate a client token for the browser to upload the file
 
        // ⚠️ Authenticate users before generating the token.
        // Otherwise, you're allowing anonymous uploads.
        const { user } = await auth(request);
        const userCanUpload = canUpload(user, pathname);
        if (!userCanUpload) {
          throw new Error('Not authorized');
        }
 
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
          tokenPayload: JSON.stringify({
            // optional, sent to your server on upload completion
            userId: user.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified of client upload completion
        // ⚠️ This will not work on `localhost` websites,
        // Use ngrok or similar to get the full upload flow
 
        console.log('blob upload completed', blob, tokenPayload);
 
        try {
          // Run any logic after the file upload completed
          // const { userId } = JSON.parse(tokenPayload);
          // await db.update({ avatar: blob.url, userId });
        } catch (error) {
          throw new Error('Could not update user');
        }
      },
    });
 
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The webhook will retry 5 times waiting for a 200
    );
  }
}
When your local website is served on http://localhost:3000, then the onUploadCompleted step won't succeed as Vercel Blob cannot contact your localhost. Instead, we recommend you run your local application through a tunneling service like ngrok , so you can experience the full Vercel Blob development flow locally.

API Routes
Good to know: If you are using the App Router, you can use Server Components or Route Handlers instead of API Routes.

API routes provide a solution to build a public API with Next.js.

Any file inside the folder pages/api is mapped to /api/* and will be treated as an API endpoint instead of a page. They are server-side only bundles and won't increase your client-side bundle size.

For example, the following API route returns a JSON response with a status code of 200:

pages/api/hello.ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}
Good to know:

API Routes do not specify CORS headers, meaning they are same-origin only by default. You can customize such behavior by wrapping the request handler with the CORS request helpers.
API Routes can't be used with static exports. However, Route Handlers in the App Router can.
API Routes will be affected by pageExtensions configuration in next.config.js.
Parameters

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // ...
}
req: An instance of http.IncomingMessage
res: An instance of http.ServerResponse
HTTP Methods
To handle different HTTP methods in an API route, you can use req.method in your request handler, like so:

pages/api/hello.ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Process a POST request
  } else {
    // Handle any other HTTP method
  }
}
Request Helpers
API Routes provide built-in request helpers which parse the incoming request (req):

req.cookies - An object containing the cookies sent by the request. Defaults to {}
req.query - An object containing the query string. Defaults to {}
req.body - An object containing the body parsed by content-type, or null if no body was sent
Custom config
Every API Route can export a config object to change the default configuration, which is the following:


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
  // Specifies the maximum allowed duration for this function to execute (in seconds)
  maxDuration: 5,
}
bodyParser is automatically enabled. If you want to consume the body as a Stream or with raw-body, you can set this to false.

One use case for disabling the automatic bodyParsing is to allow you to verify the raw body of a webhook request, for example from GitHub.


export const config = {
  api: {
    bodyParser: false,
  },
}
bodyParser.sizeLimit is the maximum size allowed for the parsed body, in any format supported by bytes, like so:


export const config = {
  api: {
    bodyParser: {
      sizeLimit: '500kb',
    },
  },
}
externalResolver is an explicit flag that tells the server that this route is being handled by an external resolver like express or connect. Enabling this option disables warnings for unresolved requests.


export const config = {
  api: {
    externalResolver: true,
  },
}
responseLimit is automatically enabled, warning when an API Routes' response body is over 4MB.

If you are not using Next.js in a serverless environment, and understand the performance implications of not using a CDN or dedicated media host, you can set this limit to false.


export const config = {
  api: {
    responseLimit: false,
  },
}
responseLimit can also take the number of bytes or any string format supported by bytes, for example 1000, '500kb' or '3mb'. This value will be the maximum response size before a warning is displayed. Default is 4MB. (see above)


export const config = {
  api: {
    responseLimit: '8mb',
  },
}
Response Helpers
The Server Response object, (often abbreviated as res) includes a set of Express.js-like helper methods to improve the developer experience and increase the speed of creating new API endpoints.

The included helpers are:

res.status(code) - A function to set the status code. code must be a valid HTTP status code
res.json(body) - Sends a JSON response. body must be a serializable object
res.send(body) - Sends the HTTP response. body can be a string, an object or a Buffer
res.redirect([status,] path) - Redirects to a specified path or URL. status must be a valid HTTP status code. If not specified, status defaults to "307" "Temporary redirect".
res.revalidate(urlPath) - Revalidate a page on demand using getStaticProps. urlPath must be a string.
Setting the status code of a response
When sending a response back to the client, you can set the status code of the response.

The following example sets the status code of the response to 200 (OK) and returns a message property with the value of Hello from Next.js! as a JSON response:

pages/api/hello.ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}
Sending a JSON response
When sending a response back to the client you can send a JSON response, this must be a serializable object. In a real world application you might want to let the client know the status of the request depending on the result of the requested endpoint.

The following example sends a JSON response with the status code 200 (OK) and the result of the async operation. It's contained in a try catch block to handle any errors that may occur, with the appropriate status code and error message caught and sent back to the client:

pages/api/hello.ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await someAsyncOperation()
    res.status(200).json({ result })
  } catch (err) {
    res.status(500).json({ error: 'failed to load data' })
  }
}
Sending a HTTP response
Sending an HTTP response works the same way as when sending a JSON response. The only difference is that the response body can be a string, an object or a Buffer.

The following example sends a HTTP response with the status code 200 (OK) and the result of the async operation.

pages/api/hello.ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await someAsyncOperation()
    res.status(200).send({ result })
  } catch (err) {
    res.status(500).send({ error: 'failed to fetch data' })
  }
}
Redirects to a specified path or URL
Taking a form as an example, you may want to redirect your client to a specified path or URL once they have submitted the form.

The following example redirects the client to the / path if the form is successfully submitted:

pages/api/hello.ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name, message } = req.body
 
  try {
    await handleFormInputAsync({ name, message })
    res.redirect(307, '/')
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch data' })
  }
}
Adding TypeScript types
You can make your API Routes more type-safe by importing the NextApiRequest and NextApiResponse types from next, in addition to those, you can also type your response data:


import type { NextApiRequest, NextApiResponse } from 'next'
 
type ResponseData = {
  message: string
}
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({ message: 'Hello from Next.js!' })
}
Good to know: The body of NextApiRequest is any because the client may include any payload. You should validate the type/shape of the body at runtime before using it.

Dynamic API Routes
API Routes support dynamic routes, and follow the same file naming rules used for pages/.

pages/api/post/[pid].ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pid } = req.query
  res.end(`Post: ${pid}`)
}
Now, a request to /api/post/abc will respond with the text: Post: abc.

Catch all API routes
API Routes can be extended to catch all paths by adding three dots (...) inside the brackets. For example:

pages/api/post/[...slug].js matches /api/post/a, but also /api/post/a/b, /api/post/a/b/c and so on.
Good to know: You can use names other than slug, such as: [...param]

Matched parameters will be sent as a query parameter (slug in the example) to the page, and it will always be an array, so, the path /api/post/a will have the following query object:


{ "slug": ["a"] }
And in the case of /api/post/a/b, and any other matching path, new parameters will be added to the array, like so:


{ "slug": ["a", "b"] }
For example:

pages/api/post/[...slug].ts
TypeScript

TypeScript

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query
  res.end(`Post: ${slug.join(', ')}`)
}
Now, a request to /api/post/a/b/c will respond with the text: Post: a, b, c.

Optional catch all API routes
Catch all routes can be made optional by including the parameter in double brackets ([[...slug]]).

For example, pages/api/post/[[...slug]].js will match /api/post, /api/post/a, /api/post/a/b, and so on.

The main difference between catch all and optional catch all routes is that with optional, the route without the parameter is also matched (/api/post in the example above).

The query objects are as follows:


{ } // GET `/api/post` (empty object)
{ "slug": ["a"] } // `GET /api/post/a` (single-element array)
{ "slug": ["a", "b"] } // `GET /api/post/a/b` (multi-element array)
Caveats
Predefined API routes take precedence over dynamic API routes, and dynamic API routes over catch all API routes. Take a look at the following examples:
pages/api/post/create.js - Will match /api/post/create
pages/api/post/[pid].js - Will match /api/post/1, /api/post/abc, etc. But not /api/post/create
pages/api/post/[...slug].js - Will match /api/post/1/2, /api/post/a/b/c, etc. But not /api/post/create, /api/post/abc
Edge API Routes
If you would like to use API Routes with the Edge Runtime, we recommend incrementally adopting the App Router and using Route Handlers instead.

The Route Handlers function signature is isomorphic, meaning you can use the same function for both Edge and Node.js runtimes.

Previous
Custom Document
Next
