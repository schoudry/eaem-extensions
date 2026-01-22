# GitHub Actions Workflows

## Sync to Adobe Cloud Manager

This workflow automatically syncs code to Adobe Cloud Manager Git repository on every push to `main`, `master`, or `develop` branches.

### Setup Instructions

To enable this workflow, you need to configure the following GitHub Secrets:

1. Go to your GitHub repository settings
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:

   - `ADOBE_GIT_USERNAME`: Your Adobe Cloud Manager Git username
   - `ADOBE_GIT_PASSWORD`: Your Adobe Cloud Manager Git password or access token

### Target Repository

- **Adobe Cloud Manager Git URL**: https://git.cloudmanager.adobe.com/acsaem/SreekanthChoudryNalabotu-p10961/

### How It Works

1. **Trigger**: Workflow runs on push to main/master/develop branches
2. **Checkout**: Fetches the complete git history
3. **Configure Git**: Sets up git user for the push operation
4. **Add Remote**: Adds Adobe Cloud Manager as a git remote
5. **Push**: Pushes code to Adobe Cloud Manager using credentials from secrets

### Notes

- The workflow uses `--force` flag to ensure successful sync
- Ensure your Adobe Cloud Manager credentials have write access to the repository
- The workflow runs on `ubuntu-latest` runner
