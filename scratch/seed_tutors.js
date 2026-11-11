const mongoose = require('mongoose');

async function seedSampleTutors() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/codequest_db');
    console.log('Connected to MongoDB for Tutor Seeding...');

    const User = require('../models/User');
    const TrainerProfile = require('../models/TrainerProfile');
    const Course = require('../models/Course');

    const javaCourse = await Course.findOne({ slug: /java/i });
    const pythonCourse = await Course.findOne({ slug: /python/i });
    const reactCourse = await Course.findOne({ slug: /react/i });

    const tutorsData = [
      {
        user: {
          name: 'Arun Kumar',
          email: 'arun@codequest.com',
          username: 'arun_tutor',
          password: 'Tutor@123',
          role: 'tutor',
          phone: '+919876543210'
        },
        profile: {
          tutorId: 'TUT1001',
          fullName: 'Arun Kumar',
          title: 'Senior Java & Cloud Architect',
          department: 'Computer Science & Engineering',
          employmentType: 'FULL-TIME',
          qualification: 'M.Tech / B.E',
          totalExperience: '8 Years',
          professionalBio: 'Senior Java & Enterprise Cloud Architect with 8+ years of industry and teaching experience in Java Full Stack development.',
          address: '123 Tech Park Road',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '600001',
          skills: [
            { name: 'Java', category: 'Programming Languages', proficiency: 'Advanced' },
            { name: 'Spring Boot', category: 'Frameworks', proficiency: 'Advanced' },
            { name: 'SQL / MySQL', category: 'Databases', proficiency: 'Advanced' },
            { name: 'AWS', category: 'Cloud & DevOps', proficiency: 'Intermediate' }
          ],
          teachingDomains: [
            { domainId: javaCourse?._id, domainName: javaCourse?.title || 'JAVA', teachingLevel: 'Primary', experienceYears: 8, priority: 'Primary' }
          ]
        }
      },
      {
        user: {
          name: 'Elavarasi M',
          email: 'elavarasi@codequest.com',
          username: 'ela457',
          password: 'Tutor@123',
          role: 'tutor',
          phone: '+919677572150'
        },
        profile: {
          tutorId: 'TUT1002',
          fullName: 'Elavarasi M',
          title: 'UI/UX & Frontend Specialist',
          department: 'Information Technology',
          employmentType: 'FULL-TIME',
          qualification: 'B.Sc / M.Sc',
          totalExperience: '4 Years',
          professionalBio: 'Frontend Specialist focusing on UI/UX Design, React.js, Tailwind CSS, and Modern Web Applications.',
          address: '45 Salem Highway',
          city: 'Salem',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '636003',
          skills: [
            { name: 'React', category: 'Frameworks', proficiency: 'Advanced' },
            { name: 'UI / UX', category: 'Design', proficiency: 'Advanced' },
            { name: 'JavaScript', category: 'Programming Languages', proficiency: 'Advanced' },
            { name: 'Tailwind CSS', category: 'Frameworks', proficiency: 'Advanced' }
          ],
          teachingDomains: [
            { domainId: reactCourse?._id, domainName: reactCourse?.title || 'REAct', teachingLevel: 'Primary', experienceYears: 4, priority: 'Primary' }
          ]
        }
      },
      {
        user: {
          name: 'Soundhariya K',
          email: 'soundh@codequest.com',
          username: 'soundh',
          password: 'Tutor@123',
          role: 'trainer',
          phone: '+919123456789'
        },
        profile: {
          tutorId: 'TUT1003',
          fullName: 'Soundhariya K',
          title: 'Data Science & Python Trainer',
          department: 'Data Analytics',
          employmentType: 'PART-TIME',
          qualification: 'M.Sc Data Science',
          totalExperience: '5 Years',
          professionalBio: 'Data Science practitioner specializing in Python, Machine Learning models, and Data Analytics.',
          address: '78 IT Corridor',
          city: 'Coimbatore',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '641001',
          skills: [
            { name: 'Python', category: 'Programming Languages', proficiency: 'Advanced' },
            { name: 'Data Science', category: 'Analytics', proficiency: 'Advanced' },
            { name: 'Pandas & NumPy', category: 'Frameworks', proficiency: 'Advanced' },
            { name: 'Machine Learning', category: 'AI', proficiency: 'Intermediate' }
          ],
          teachingDomains: [
            { domainId: pythonCourse?._id, domainName: pythonCourse?.title || 'Data Science using Python', teachingLevel: 'Primary', experienceYears: 5, priority: 'Primary' }
          ]
        }
      }
    ];

    for (const item of tutorsData) {
      let user = await User.findOne({ email: item.user.email });
      if (!user) {
        user = await User.create(item.user);
        console.log(`Created user: ${user.name} (${user.email})`);
      }

      let profile = await TrainerProfile.findOne({ userId: user._id });
      if (!profile) {
        profile = await TrainerProfile.create({
          userId: user._id,
          ...item.profile
        });
        console.log(`Created TrainerProfile for: ${user.name}`);
      }
    }

    console.log('✅ Sample Tutors successfully seeded!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error seeding sample tutors:', err);
    process.exit(1);
  }
}

seedSampleTutors();
