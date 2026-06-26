const jwt = require('jsonwebtoken');
const AdminModel = require('../models/adminModel');
const emailService = require('../services/emailService');

const signup = async (req, res, next) => {
  try {
    const { name, email, password, signup_key } = req.body;

    if (signup_key !== process.env.ADMIN_SIGNUP_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid signup key. Contact your system administrator.' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const count = await AdminModel.count();
    if (count >= 1) {
      return res.status(400).json({ success: false, message: 'Admin account already exists. Please login.' });
    }

    const exists = await AdminModel.findByEmail(email);
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const admin = await AdminModel.create({ name, email, password });
    await emailService.sendAdminWelcome({ name: admin.name, email: admin.email }).catch(() => {});

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({ success: true, data: { admin, token } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await AdminModel.findByEmail(email);
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await AdminModel.verifyPassword(password, admin.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );  

    res.json({ success: true, data: { admin: { id: admin.id, name: admin.name, email: admin.email }, token } });
  } catch (err) { next(err); }
};

const me = async (req, res) => {
  res.json({ success: true, data: req.admin });
};


const InternModel = require('../models/internModel');
const bcrypt = require('bcryptjs');

const internLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const intern = await InternModel.findByEmail(email);
    if (!intern || !intern.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, intern.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: intern.id, email: intern.email, role: 'intern' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        intern: { id: intern.id, name: intern.name, email: intern.email, department: intern.department },
        token,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { signup, login, me, internLogin };