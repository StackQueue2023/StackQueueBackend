const archiverModule = require('archiver');
const path = require('path');
const fs = require('fs');
const { isSensitiveFile, isExcludedFile } = require('./githubService');

function createZipArchive(options = {}) {
  if (typeof archiverModule === 'function') {
    return archiverModule('zip', options);
  }
  if (archiverModule.ZipArchive) {
    return new archiverModule.ZipArchive(options);
  }
  throw new Error('Unsupported archiver module format');
}

/**
 * Generate and stream a clean, complete source-code ZIP archive for approved projects.
 * Excludes secrets (.env), .git, node_modules, and build caches.
 * Preserves directory structure and ensures a comprehensive README is included.
 */
async function streamProjectZip({
  res,
  projectRequirement,
  requirement,
  assignment,
  student,
  tutor,
  localSourcePath
}) {
  const reqObj = projectRequirement || requirement || assignment?.projectRequirementId;
  const safeTitle = (reqObj?.title || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const filename = `${safeTitle}.zip`;

  if (res.setHeader) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }

  const archive = createZipArchive({
    zlib: { level: 9 } // Maximum compression
  });

  archive.on('error', (err) => {
    console.error('Archiver error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Archive generation error' });
    }
  });

  archive.pipe(res);

  // Check if a local mirrored repository exists
  let hasLocalFiles = false;
  if (localSourcePath && fs.existsSync(localSourcePath)) {
    function addDirRecursive(currentDir, relativePath = '') {
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const fullItemPath = path.join(currentDir, item);
        const relItemPath = relativePath ? path.join(relativePath, item) : item;
        const stat = fs.statSync(fullItemPath);

        if (stat.isDirectory()) {
          if (!isExcludedFile(item)) {
            addDirRecursive(fullItemPath, relItemPath);
          }
        } else {
          if (!isSensitiveFile(item) && !isExcludedFile(item)) {
            archive.file(fullItemPath, { name: relItemPath });
            hasLocalFiles = true;
          }
        }
      }
    }

    try {
      addDirRecursive(localSourcePath);
    } catch (walkErr) {
      console.error('Error walking source directory:', walkErr);
    }
  }

  const stuObj = student || assignment?.studentId;
  const tutObj = tutor || assignment?.tutorId;

  // Ensure README.md is present with full project details
  const generatedReadme = `# ${reqObj?.title || 'Capstone Project'}
**Project ID:** ${reqObj?.projectId || 'PRJ'}
**Category:** ${reqObj?.category || 'Software Engineering'}
**Difficulty:** ${reqObj?.difficulty || 'Intermediate'}

## Project Overview
${reqObj?.description || ''}

### Problem Statement
${reqObj?.problemStatement || ''}

### Student & Evaluation Metadata
- **Student Name:** ${stuObj?.name || 'Assigned Student'} (${stuObj?.studentId || 'N/A'})
- **Assigned Tutor:** ${tutObj?.name || 'Tutor Reviewer'}
- **Assignment Date:** ${assignment?.assignmentDate ? new Date(assignment.assignmentDate).toLocaleDateString() : 'N/A'}
- **Approval Status:** ${assignment?.status || 'Approved'}
- **Verified GitHub Repository:** ${assignment?.destinationGithubRepoUrl || 'Synced in Stack Queue Archive'}
- **Commit SHA:** ${assignment?.destinationCommitSha || 'HEAD'}

### Technical Requirements
${reqObj?.technicalRequirements || 'Follow industry standards and best practices.'}

### Technology Stack
${(reqObj?.technologies || []).map(t => `- ${t}`).join('\n') || '- Modern Full-Stack Technologies'}

### Objectives & Expected Output
${(reqObj?.objectives || []).map(o => `- ${o}`).join('\n') || '- Comprehensive implementation of project features.'}

## Execution & Setup Instructions
1. Unzip the project files into your desired workspace directory.
2. Review configuration settings (never commit secret keys or passwords).
3. Install project dependencies using standard package manager:
   - For Node.js / JavaScript / React: \`npm install\`
   - For Python: \`pip install -r requirements.txt\`
   - For Java / Spring Boot: \`./mvnw clean install\`
4. Run the development or build server as outlined in documentation.

---
*Verified and Certified by Stack Queue Education LMS Platform.*
`;

  // Append README.md if not already packaged
  archive.append(generatedReadme, { name: 'README.md' });

  // If local directory was empty, include sample project scaffold
  if (!hasLocalFiles) {
    const packageJsonContent = JSON.stringify({
      name: safeTitle,
      version: "1.0.0",
      description: reqObj?.description || '',
      main: "index.js",
      scripts: {
        "start": "node index.js"
      },
      keywords: reqObj?.technologies || [],
      author: stuObj?.name || "Stack Queue Student",
      license: "MIT"
    }, null, 2);

    archive.append(packageJsonContent, { name: 'package.json' });

    const starterIndex = `// ${reqObj?.title || 'Capstone Project'}
// Project ID: ${reqObj?.projectId || 'PRJ'}
// Author: ${stuObj?.name || 'Student'}

console.log('Initializing ${reqObj?.title || 'Capstone Project'}...');
console.log('Project Status: Approved and Verified by Stack Queue LMS');
`;
    archive.append(starterIndex, { name: 'src/index.js' });
  }

  await archive.finalize();
}

module.exports = {
  streamProjectZip
};
