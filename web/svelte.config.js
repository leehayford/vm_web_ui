
import adapter from '@sveltejs/adapter-static' // npm install @sveltejs/adapter-static
// import adapter from '@sveltejs/adapter-auto' 
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter( {
            fallback: 'index.html'
        } )
	}
};

export default config;