const jwt = require('jsonwebtoken')
const {User} = require('../models/user')

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ', '')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { expiresIn: '24h' });
        // const user = await User.findById(decoded.id).select("-password");
        // if (!user) {
        //     return res.status(401).json({ message: "User không tồn tại" });
        // }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin only' });
    };
    next();
}


module.exports = { protect, isAdmin }