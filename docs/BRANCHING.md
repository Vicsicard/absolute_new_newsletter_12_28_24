# Branching Strategy

## Branch Structure

### Main Branches
- `master` - Production code (stable)
- `development` - Main development branch

### Feature Branches
Create feature branches from `development` using the format:
- `feature/feature-name`
- `bugfix/bug-name`
- `enhancement/enhancement-name`

## Workflow

### 1. Development Process
1. Create feature branch from `development`
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit regularly
   ```bash
   git add .
   git commit -m "feat: your commit message"
   ```

3. Push changes to GitHub
   ```bash
   git push origin feature/your-feature-name
   ```

### 2. Testing Process
1. Test changes thoroughly in feature branch
2. Create pull request to `development`
3. Review code and test in development environment
4. Merge to `development` if all tests pass

### 3. Release Process
1. Create release branch from `development`
   ```bash
   git checkout development
   git checkout -b release/v1.x.x
   ```

2. Test thoroughly in staging environment
3. Create pull request to `master`
4. After approval, merge to `master`
5. Tag the release
   ```bash
   git tag -a v1.x.x -m "Release v1.x.x"
   git push origin v1.x.x
   ```

## Protected Branches

### master (Production)
- No direct pushes
- Requires pull request and review
- Must pass all tests
- Must be up-to-date with master

### development
- No direct pushes
- Requires pull request
- Must pass all tests

## Version Control Best Practices

1. **Commit Messages**
   - Use conventional commits format
   - Be descriptive and clear
   - Reference issues/tickets when applicable

2. **Branch Management**
   - Keep branches up to date with their parent branch
   - Delete branches after merging
   - Regularly clean up old branches

3. **Code Review**
   - Review all changes before merging
   - Use pull request templates
   - Address all comments and suggestions

4. **Testing**
   - Test all changes locally before pushing
   - Ensure CI/CD pipeline passes
   - Perform manual testing when necessary

## Emergency Hotfix Process

1. Create hotfix branch from `master`
   ```bash
   git checkout master
   git checkout -b hotfix/critical-fix
   ```

2. Make necessary fixes
3. Create pull requests to both `master` and `development`
4. After approval, merge to both branches
5. Tag the hotfix release

## Current Version
- Production (master): v1.0.0
- Development: v1.1.0-dev
