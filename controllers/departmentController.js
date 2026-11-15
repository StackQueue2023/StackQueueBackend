const Department = require('../models/Department');
const College = require('../models/College');
const Batch = require('../models/Batch');

const DEFAULT_DEPARTMENTS = [
  { name: 'Computer Science and Engineering', code: 'CSE', description: 'Core Computing and Software Systems' },
  { name: 'Information Technology', code: 'IT', description: 'Information Infrastructure and Cloud Technologies' },
  { name: 'Artificial Intelligence & Data Science', code: 'AIDS', description: 'Machine Learning, AI, and Big Data Analytics' },
  { name: 'Electronics and Communication Engineering', code: 'ECE', description: 'Electronics, Signals, and Embedded Systems' },
  { name: 'Mechanical Engineering', code: 'MECH', description: 'Thermal, Design, and Manufacturing' }
];

/**
 * GET /api/admin/departments?collegeId=...
 * Fetch departments mapped to a specific college (or all active departments)
 * Automatically seeds default standard departments if none exist for this college.
 */
exports.getDepartments = async (req, res) => {
  try {
    const { collegeId } = req.query;

    if (!collegeId) {
      // If no college specified, return all active departments grouped/sorted
      const allDepts = await Department.find({ isActive: true })
        .populate('collegeId', 'name code city')
        .sort({ name: 1 });
      return res.status(200).json({ success: true, count: allDepts.length, data: allDepts });
    }

    // Verify college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    let departments = await Department.find({ collegeId, isActive: true }).sort({ name: 1 });

    // If no custom departments exist yet for this college, seed default standard ones
    if (departments.length === 0) {
      const seeded = [];
      for (const d of DEFAULT_DEPARTMENTS) {
        const created = await Department.create({
          collegeId: college._id,
          name: d.name,
          code: d.code,
          description: d.description,
          isActive: true
        });
        seeded.push(created);
      }

      // Also ensure College.departments has the default codes
      const defaultCodes = DEFAULT_DEPARTMENTS.map(d => d.code);
      college.departments = Array.from(new Set([...(college.departments || []), ...defaultCodes]));
      await college.save();

      departments = seeded;
    }

    return res.status(200).json({
      success: true,
      college: {
        _id: college._id,
        name: college.name,
        code: college.code,
        city: college.city
      },
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('getDepartments error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/admin/departments
 * Create a new custom department for a college
 */
exports.createDepartment = async (req, res) => {
  try {
    const { collegeId, name, code, description } = req.body;

    if (!collegeId) {
      return res.status(400).json({ success: false, message: 'College selection is required to add a department.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department Name is required.' });
    }

    const trimmedName = name.trim();
    // Auto-generate code if omitted (e.g. "Cyber Security" -> "CS" or uppercase initials)
    let trimmedCode = (code || '').trim().toUpperCase();
    if (!trimmedCode) {
      const words = trimmedName.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        trimmedCode = words.map(w => w[0]).join('').toUpperCase();
      } else {
        trimmedCode = trimmedName.slice(0, 4).toUpperCase();
      }
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'Selected College was not found.' });
    }

    // Check duplicate department name or code within the same college
    const existing = await Department.findOne({
      collegeId,
      isActive: true,
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } },
        { code: trimmedCode }
      ]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Department "${existing.name}" (${existing.code}) already exists in ${college.name}.`
      });
    }

    const newDept = await Department.create({
      collegeId,
      name: trimmedName,
      code: trimmedCode,
      description: (description || '').trim(),
      isActive: true
    });

    // Also update College.departments array
    if (!college.departments.includes(trimmedCode)) {
      college.departments.push(trimmedCode);
      await college.save();
    }

    return res.status(201).json({
      success: true,
      message: `Department "${newDept.name}" (${newDept.code}) created successfully for ${college.name}.`,
      data: newDept
    });
  } catch (error) {
    console.error('createDepartment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/admin/departments/:id
 * Edit an existing department's details
 */
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, isActive } = req.body;

    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const trimmedName = name ? name.trim() : dept.name;
    const trimmedCode = code ? code.trim().toUpperCase() : dept.code;

    // Check uniqueness within the college excluding this record
    const duplicate = await Department.findOne({
      _id: { $ne: dept._id },
      collegeId: dept.collegeId,
      isActive: true,
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } },
        { code: trimmedCode }
      ]
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Another department with name "${duplicate.name}" or code "${duplicate.code}" already exists in this college.`
      });
    }

    const oldCode = dept.code;
    dept.name = trimmedName;
    dept.code = trimmedCode;
    if (description !== undefined) dept.description = description.trim();
    if (isActive !== undefined) dept.isActive = Boolean(isActive);

    await dept.save();

    // Sync with College.departments array
    const college = await College.findById(dept.collegeId);
    if (college) {
      college.departments = college.departments.filter(c => c !== oldCode);
      if (dept.isActive && !college.departments.includes(trimmedCode)) {
        college.departments.push(trimmedCode);
      }
      await college.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      data: dept
    });
  } catch (error) {
    console.error('updateDepartment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/admin/departments/:id
 * Delete a department with safety check for existing batches
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const dept = await Department.findById(id);
    if (!dept) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    // Check if batches are using this department in this college
    const batchCount = await Batch.countDocuments({
      collegeId: dept.collegeId,
      department: { $in: [dept.code, dept.name] }
    });

    if (batchCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department "${dept.name}" (${dept.code}) because it is actively assigned to ${batchCount} batch(es). Please reassign those batches first.`
      });
    }

    // Safe to remove
    const collegeId = dept.collegeId;
    const oldCode = dept.code;
    await Department.findByIdAndDelete(id);

    // Remove from College.departments array
    await College.findByIdAndUpdate(collegeId, {
      $pull: { departments: oldCode }
    });

    return res.status(200).json({
      success: true,
      message: `Department "${dept.name}" (${dept.code}) deleted successfully.`
    });
  } catch (error) {
    console.error('deleteDepartment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
