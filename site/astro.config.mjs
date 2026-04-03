// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://summon-dev.github.io',
	base: '/summon',
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [
		starlight({
			title: 'Summon',
			tagline: 'Ship like a team of 10. You\'re the only human.',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/summon-dev/summon' }],
			customCss: ['./src/styles/global.css'],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
						{ label: 'How It Works', slug: 'getting-started/how-it-works' },
					],
				},
				{
					label: 'The Team',
					items: [
						{ label: 'Meet the Team', slug: 'team/overview' },
						{ label: 'Slash Commands', slug: 'team/commands' },
					],
				},
				{
					label: 'Methodology',
					items: [
						{ label: '7-Phase Workflow', slug: 'methodology/phases' },
						{ label: 'Architecture Gates', slug: 'methodology/architecture-gates' },
						{ label: 'TDD Workflow', slug: 'methodology/tdd' },
						{ label: 'Code Review', slug: 'methodology/code-review' },
					],
				},
				{
					label: 'Integrations',
					items: [
						{ label: 'GitHub Projects', slug: 'integrations/github-projects' },
						{ label: 'Jira', slug: 'integrations/jira' },
					],
				},
			],
		}),
	],
});
