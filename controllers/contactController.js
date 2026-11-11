const ContactMessage = require('../models/ContactMessage');

// POST /api/contact (Public inquiry submission)
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required.'
      });
    }

    const contact = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      subject: subject.trim(),
      message: message.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Our admissions & academic team will get back to you shortly.',
      data: contact
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/contact/admin/messages (Admin only)
exports.getContactMessages = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 });
    const totalCount = await ContactMessage.countDocuments();
    const unreadCount = await ContactMessage.countDocuments({ status: 'UNREAD' });

    return res.json({
      success: true,
      data: messages,
      counts: {
        total: totalCount,
        unread: unreadCount
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/contact/admin/messages/:id (Update status or reply)
exports.updateContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply } = req.body;

    const message = await ContactMessage.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (status) message.status = status;
    if (adminReply !== undefined) {
      message.adminReply = adminReply;
      message.repliedAt = new Date();
      if (!status) message.status = 'REPLIED';
    }

    await message.save();
    return res.json({ success: true, message: 'Message updated successfully', data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/contact/admin/messages/:id
exports.deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ContactMessage.findByIdAndDelete(id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    return res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
