const { response } = require('express');
const Converation = require('../models/conversation');
const apiService = require('../services/apiService');
const aiServicec = require('../services/apiService');


exports.sendMessage = async (req, res) => {
    try {
        const { message, userId, conversationId, conversationHistory = [] } = req.body;

        if (!message || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Message and userID are required',
            });
        }

        const aiResponse = await apiService.getResponse(message, conversationHistory);

        let conversation;
        if (conversationId) {
            conversation = await Converation.findById(conversationId);
            if (conversation) {
                conversation.messages.push(
                    { text: message, isUser: true },
                    { text: aiResponse, isUser: false },
                );
                await conversation.save();
            }
        } else {
            conversation = new Converation({
                userId,
                messages: [
                    { text: message, isUser: true },
                    { text: aiResponse, isUser: false },
                ]
            });
            await conversation.save();
        }

        res.json({
            success: true,
            data: {
                response: aiResponse,
                conversationId: conversation._id,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process message'
        });
    }
}

exports.getHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, page = 1 } = req.query;

        const conversations = await Converation.find({ userId })
            .sort({ updateAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Converation.countDocuments({ userId });

        res.json({
            success: true,
            data: {
                conversations,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch history'
        });
    }
}

exports.getConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Converation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversation not found',
            });
        }

        res.json({
            success: true,
            data: conversation,
        })
    } catch (error) {
        console.error('Get Conversation Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch conversation'
        });
    }
}

exports.deleteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Converation.findByIdAndDelete(conversationId);

        if (!conversation) {
            return res.status(404).json({
                success: false,
                error: 'Conversaiton not found',
            })
        }

        res.json({
            success: true,
            message: 'Conversation deleted successfully',
        })
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete conversation'
        });
    }
}

exports.clearHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await Converation.deleteMany({ userId });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} conversations`
        });
    } catch (error) {
        console.error('Clear History Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to clear history'
        });
    }
}