const fs = require('fs');
const {Octokit} = require('@octokit/rest');
const octokit = new Octokit();
async function main() {
    console.log('Starting the README update process...');
    console.log('Fetching repository data for user CrazySloths...');
    let repos;
    try {
        const reponse = await octokit.rest.repos.listForUser({
            username: 'CrazySloths',
            type: 'owner',
            sort: 'updated',
            per_page: 100,
        });
        repos = reponse.data;
        console.log(`Found ${repos.length} repositories.`);
    } catch (error) {
        console.error('Error fetching repositories:', error.message);
        process.exit(1);
    }
    console.error('Scanning repositories for technologies...');
    const detectedSkills = new Set();
    for (const repo of repos) {
        try {
            const { data: packageJsonContent } = await octokit.rest.repos.getContent({
                owner: 'CrazySloths',
                repo: repo.name,
                path: 'package.json',
            });
            const decodeContent = Buffer.from(packageJsonContent.content, 'base64').toString('utf-8');
            const packageJson = JSON.parse(decodeContent);
            const dependencies = {...packageJson.dependencies, ...packageJson.devDependencies};
            console.log(`Scanning ${repo.name}...`);
            if (dependencies.react) detectedSkills.add('react');
            if (dependencies.vue) detectedSkills.add('vue');
            if (dependencies.angular) detectedSkills.add('angular');
            if (dependencies.next) detectedSkills.add('nextjs');
            if (dependencies.tailwindcss) detectedSkills.add('tailwind');
            if (dependencies.bootstrap) detectedSkills.add('bootstrap');
            if (dependencies.express) detectedSkills.add('express');
            if (dependencies.fastify) detectedSkills.add('fastify');
            if (dependencies.nest) detectedSkills.add('nestjs');
            if (dependencies.lodash) detectedSkills.add('lodash');
        } catch (error) {
            if (error.status === 404) {
                console.log(`Error processing ${repo.name}`, error.message);
            }
        }
    }
    console.log('Skill detection complete. Found skills:', Array.from(detectedSkills));
    const skillsQuery = Array.from(detectedSkills).join(',');
    const newContent = `<img src="https://skillicons.dev/icons?i=${skillsQuery}" />`;
    console.log('Generated new skill icon markdow.');
    const readmePath = 'README.md';
    const startMaker = '';
    const endMarker = '';
    const repaceBlock = `${startMaker}\n${newContent}\n${endMarker}`;
    try {
        const readmeContent = fs.readFileSync(readmePath, 'utf-8');
        const regex = new RegExp(`${startMaker}[\\s\\S]*?${endMarker}`, 's');
        const updatedReadme = readmeContent.replace(regex, repaceBlock);
        fs.writeFileSync(readmePath, updatedReadme);
        console.log('README.md has been updated successfully!');
    } catch (error) {
        console.error('Error updating README.md:', error.message);
        process.exit(1);
    }
}
main().catch(error => {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
});