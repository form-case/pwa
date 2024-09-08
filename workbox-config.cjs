module.exports = {
	globDirectory: 'static/',
	globPatterns: [
		'**/*.{png,json,txt,webp,css,woff,html,ico,js}'
	],
	swDest: 'build/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};