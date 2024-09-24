// workbox-config.cjs
module.exports = {
	globDirectory: 'build/',
	globPatterns: [
	  '**/*.{png,json,txt,webp,css,woff,html,ico,js}'
	],
	swDest: 'build/sw.js',
	ignoreURLParametersMatching: [
	  /^utm_/,
	  /^fbclid$/
	],
	runtimeCaching: [{
	  urlPattern: /^https:\/\/form-case-f0609\.web\.app\/_app\/immutable\/nodes\/.*\.js$/,
	  handler: 'StaleWhileRevalidate',
	  options: {
		cacheName: 'immutable-js',
		expiration: {
		  maxEntries: 100,
		  maxAgeSeconds: 31536000, // 1 year
		},
	  },
	},
	{
	  urlPattern: /^https:\/\/form-case-f0609\.web\.app\/_app\/immutable\/assets\/.*\.(css|svg|woff|png|webp)$/,
	  handler: 'CacheFirst',
	  options: {
		cacheName: 'immutable-assets',
		expiration: {
		  maxEntries: 100,
		  maxAgeSeconds: 31536000, // 1 year
		},
	  },
	},
	]
  };
  