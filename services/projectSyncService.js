const Project = require('../models/Project');
const ProjectRequirement = require('../models/ProjectRequirement');

/**
 * Generate a clean uppercase project ID code from slug/title and MongoDB ObjectId
 */
function generateProjectCode(slug, id) {
  const cleanSlug = (slug || 'project').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 10);
  const suffix = id ? id.toString().slice(-4).toUpperCase() : Math.floor(1000 + Math.random() * 9000);
  return `PRJ-${cleanSlug}-${suffix}`;
}

/**
 * Synchronize a single Project document from Admin Domain Management into ProjectRequirement
 */
async function syncProjectToRequirement(project) {
  if (!project || !project.title) return null;

  try {
    const slug = (project.slug || project.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
    const projectIdCode = generateProjectCode(slug, project._id);

    const reqFeatures = (project.requirements || []).map((reqText, idx) => ({
      id: `feat-${idx + 1}`,
      title: reqText,
      description: reqText,
      isMandatory: true
    }));

    const updateData = {
      title: project.title,
      slug: slug,
      category: project.category || 'Enterprise Software',
      description: project.description || `Capstone software project for ${project.title}.`,
      problemStatement: project.description || `Implement and deploy ${project.title} meeting enterprise architecture requirements.`,
      objectives: (project.requirements && project.requirements.length > 0)
        ? project.requirements
        : [`Build and deploy production-ready ${project.title}`],
      requiredFeatures: reqFeatures,
      technologies: project.technologies || [],
      difficulty: project.difficulty || 'Intermediate',
      status: project.status === 'Archived' ? 'Archived' : 'Published',
      assignedTutors: project.teamMembers || []
    };

    const requirement = await ProjectRequirement.findOneAndUpdate(
      { slug },
      {
        $setOnInsert: { projectId: projectIdCode },
        $set: updateData
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return requirement;
  } catch (err) {
    console.error(`[ProjectSyncService] Error syncing project "${project?.title}":`, err.message);
    return null;
  }
}

/**
 * Synchronize all active Project documents into ProjectRequirement collection
 */
async function syncAllProjectsToRequirements() {
  try {
    const allProjects = await Project.find({ status: { $ne: 'Archived' } });
    const results = [];
    for (const proj of allProjects) {
      const res = await syncProjectToRequirement(proj);
      if (res) results.push(res);
    }
    return results;
  } catch (err) {
    console.error('[ProjectSyncService] Error during batch project sync:', err.message);
    return [];
  }
}

/**
 * Delete or archive the corresponding ProjectRequirement when an admin deletes a Project
 */
async function removeProjectRequirement(project) {
  if (!project) return;
  try {
    const slug = project.slug || project.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    await ProjectRequirement.deleteMany({ slug });
  } catch (err) {
    console.error(`[ProjectSyncService] Error removing requirement for "${project?.title}":`, err.message);
  }
}

module.exports = {
  syncProjectToRequirement,
  syncAllProjectsToRequirements,
  removeProjectRequirement
};
