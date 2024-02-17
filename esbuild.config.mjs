import path from 'path';
import esbuild from 'esbuild';
import babel from 'esbuild-plugin-babel';

esbuild
	.context({
		absWorkingDir: path.join(process.cwd(), 'public/js'),
		bundle: true,
		entryPoints: ['index.js'],
		logLevel: 'info',
		minify: true,
		outfile: 'app.js',
		plugins: [babel()],
		sourcemap: true,
		target: 'es2016',
		treeShaking: true,
	})
	.then(context => {
		if (process.argv.includes('--watch')) {
			// Enable watch mode
			context.watch();
		} else {
			// Build once and exit if not in watch mode
			context.rebuild().then(result => {
				context.dispose();
			});
		}
	})
	.catch(() => process.exit(1));
