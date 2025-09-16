#!/usr/bin/env node

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deploy() {
  const args = process.argv.slice(2);
  const target = args[0]?.toLowerCase();

  console.log('🚀 WebXRide GitHub Deployment Script');
  console.log('====================================\n');

  let deployTarget = 'develop';

  if (target === 'production' || target === 'main') {
    console.log('⚠️  WARNING: You are attempting to deploy to PRODUCTION (main branch)');
    console.log('   This will affect the live site via Netlify\n');
    
    const confirm = await question('Are you sure you want this to go to the live production server (main branch)? (yes/no): ');
    
    if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
      deployTarget = 'main';
      console.log('\n✅ Confirmed: Deploying to PRODUCTION (main branch)');
    } else {
      console.log('\n❌ Production deployment cancelled.');
      const devConfirm = await question('Would you like to deploy to development (develop branch) instead? (yes/no): ');
      
      if (devConfirm.toLowerCase() === 'yes' || devConfirm.toLowerCase() === 'y') {
        deployTarget = 'develop';
        console.log('\n✅ Deploying to DEVELOPMENT (develop branch) instead');
      } else {
        console.log('\n❌ Deployment cancelled.');
        process.exit(0);
      }
    }
  } else if (target === 'development' || target === 'develop') {
    deployTarget = 'develop';
    console.log('✅ Deploying to DEVELOPMENT (develop branch)');
  } else {
    // Default to development for safety
    deployTarget = 'develop';
    console.log('✅ Defaulting to DEVELOPMENT deployment (develop branch, safety first!)');
  }

  console.log('\n📦 Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');

    // Add all changes
    execSync('git add .', { stdio: 'inherit' });
    // Commit (ignore if nothing to commit)
    try {
      execSync('git commit -m "Automated deployment commit"', { stdio: 'inherit' });
    } catch (e) {
      console.log('ℹ️  No changes to commit.');
    }

    // Push to the correct branch
    if (deployTarget === 'main') {
      console.log('\n🚀 Pushing to PRODUCTION (main branch)...');
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('\n🎉 Production deployment (push to main) completed! Netlify will auto-deploy.');
    } else {
      console.log('\n🚀 Pushing to DEVELOPMENT (develop branch)...');
      execSync('git push origin develop', { stdio: 'inherit' });
      console.log('\n🎉 Development deployment (push to develop) completed! Netlify will auto-deploy.');
    }
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

deploy().catch(console.error); 