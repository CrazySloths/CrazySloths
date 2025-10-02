const fs = require('fs');
const { Octokit } = require('@octokit/rest');

// Initialize Octokit
const octokit = new Octokit();

async function main() {
    console.log('Starting the README update process...');

    // Fetch repositories
    console.log('Fetching repository data for user CrazySloths...');
    let repos;
    try {
        const response = await octokit.rest.repos.listForUser({
            username: 'CrazySloths',
            type: 'owner',
            sort: 'updated',
            per_page: 100,
        });
        repos = response.data;
        console.log(`✅ Found ${repos.length} repositories.`);
    } catch (error) {
        console.error('Error fetching repositories:', error.message);
        process.exit(1);
    }

    // Scan repositories for technologies
    console.log('Scanning repositories for technologies...');
    const detectedSkills = new Set();

    for (const repo of repos) {
        // --- Check for Node.js/JavaScript projects ---
        try {
            const { data: packageJsonContent } = await octokit.rest.repos.getContent({
                owner: 'CrazySloths',
                repo: repo.name,
                path: 'package.json',
            });
            const decodedContent = Buffer.from(packageJsonContent.content, 'base64').toString('utf8');
            const packageJson = JSON.parse(decodedContent);
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

            console.log(`🔎 Scanning ${repo.name} for JS skills...`);
            if (dependencies.react) detectedSkills.add('react');
            if (dependencies.vue) detectedSkills.add('vue');
            if (dependencies.angular) detectedSkills.add('angular');
            if (dependencies.next) detectedSkills.add('nextjs');
            if (dependencies.tailwindcss) detectedSkills.add('tailwind');
            if (dependencies.bootstrap) detectedSkills.add('bootstrap');
            if (dependencies.express) detectedSkills.add('express');
            // You can add more JS skill checks here

        } catch (error) {
            // If package.json doesn't exist (404), we just continue silently.
            if (error.status !== 404) {
                console.error(`Error processing package.json for ${repo.name}:`, error.message);
            }
        }

        // --- NEW!! Check for PHP/Laravel projects ---
        try {
            // We just need to check if the file exists. We don't need to read it yet.
            await octokit.rest.repos.getContent({
                owner: 'CrazySloths',
                repo: repo.name,
                path: 'composer.json',
            });
            
            // If the above line doesn't throw an error, the file exists.
            console.log(`💡 Found PHP/Composer project in ${repo.name}!`);
            detectedSkills.add('php');
            detectedSkills.add('laravel'); // Assuming composer.json often means Laravel for you.
            detectedSkills.add('mysql'); // PHP projects often use MySQL

        } catch (error) {
            // If composer.json doesn't exist (404), we just continue silently.
            if (error.status !== 404) {
                console.error(`Error processing composer.json for ${repo.name}:`, error.message);
            }
        }
    }

    // Generate the new README content
    console.log('✅ Skill detection complete. Found skills:', Array.from(detectedSkills));
    const skillsQuery = Array.from(detectedSkills).join(',');
    const newContent = `<img src="https://skillicons.dev/icons?i=${skillsQuery}" />`;
    console.log('Generated new skill icon markdown.');

    // Update the README file
    const readmePath = 'README.md';
    // FIXED: The markers must not be empty!
    const startMarker = '';
    const endMarker = '';
    const replacementBlock = `${startMarker}\n${newContent}\n${endMarker}`;

    try {
        const readmeContent = fs.readFileSync(readmePath, 'utf8');
        const regex = new RegExp(`${startMarker}[\\s\\S]*${endMarker}`, 's');
        const updatedReadme = readmeContent.replace(regex, replacementBlock);
        fs.writeFileSync(readmePath, updatedReadme);
        console.log('✅ README.md has been updated successfully!');
    } catch (error) {
        console.error('Error updating README.md:', error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
});