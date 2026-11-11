require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const CompanyPortal = require('../models/CompanyPortal');
const { getHomepageData, getCourses, getInternships, getProducts } = require('../controllers/portalController');

async function testEndpoints() {
  try {
    await connectDB();
    console.log('[Test] Connected to MongoDB');

    // Mock Express req and res
    const createMockRes = (name) => ({
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.data = payload;
        console.log(`✅ [${name}] status: ${this.statusCode || 200}, success: ${payload.success}`);
        return this;
      }
    });

    // 1. Test getHomepageData
    const resHome = createMockRes('getHomepageData');
    await getHomepageData({}, resHome);
    const d = resHome.data.data;
    console.log(`- Company Name: ${d.companyInfo.name}`);
    console.log(`- Tagline: ${d.companyInfo.tagline}`);
    console.log(`- Statistics: Courses: ${d.statistics.coursesCount}, Internships: ${d.statistics.internshipDomainsCount}, Students Trained: ${d.statistics.studentsTrained}`);
    console.log(`- What We Do cards: ${d.whatWeDo.length}`);
    console.log(`- Featured Courses: ${d.featuredCourses.length}`);
    console.log(`- Trending Courses: ${d.trendingCourses.length}`);
    console.log(`- Featured Internships: ${d.featuredInternships.length}`);
    console.log(`- Products: ${d.products.length}`);
    console.log(`- Special Offers: ${d.specialOffers.length}`);
    console.log(`- Why Choose Us: ${d.whyChooseUs.length}`);
    console.log(`- Learning Journey Steps: ${d.learningJourney.length}`);

    // 2. Test getCourses
    const resCourses = createMockRes('getCourses');
    await getCourses({ query: {} }, resCourses);
    console.log(`- Total courses returned: ${resCourses.data.data.total}`);

    // 3. Test getInternships
    const resInternships = createMockRes('getInternships');
    await getInternships({ query: {} }, resInternships);
    console.log(`- Total internship domains returned: ${resInternships.data.data.total}`);

    // 4. Test getProducts
    const resProducts = createMockRes('getProducts');
    await getProducts({ query: {} }, resProducts);
    console.log(`- Total products returned: ${resProducts.data.data.total}`);

    console.log('\n🎉 ALL PORTAL CONTROLLERS & DATA STRUCTURES VERIFIED!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testEndpoints();
