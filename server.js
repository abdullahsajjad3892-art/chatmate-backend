const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Message = require('./models/Message');
const { translateText } = require('./utils/translate');

// MongoDB Connect Karein
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const contactRoutes = require('./routes/contactRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('ChatMate Backend API is running...');
});

const onlineUsers = {};

io.on('connection', (socket) => {
  console.log('New socket connected:', socket.id);

  socket.on('register', (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`User ${userId} is online with socket ${socket.id}`);
  });

  socket.on('send_message', async (data) => {
    const { sender_id, receiver_id, message_text, sender_language } = data;
    const senderLang = sender_language || 'en';

    try {
      const newMessage = await Message.create({
        sender_id,
        receiver_id,
        message_text,
        sender_language: senderLang,
      });

      const sentAt = newMessage.sent_at;

      // Sender ko unka apna original message wapas milta hai
      socket.emit('message_sent', {
        id: newMessage._id,
        sender_id,
        receiver_id,
        message_text,
        sent_at: sentAt,
      });

      // Receiver ko unki language mein translated message milta hai
      const receiverSocketId = onlineUsers[receiver_id];
      if (receiverSocketId) {
        const receiverUser = await User.findById(receiver_id);
        const receiverLang = receiverUser?.language_code || 'en';
        const translatedText = await translateText(message_text, senderLang, receiverLang);

        io.to(receiverSocketId).emit('receive_message', {
          id: newMessage._id,
          sender_id,
          receiver_id,
          message_text: translatedText,
          sent_at: sentAt,
        });
      }
    } catch (error) {
      console.log('Error saving message:', error.message);
    }
  });

  socket.on('typing', (data) => {
    const receiverSocketId = onlineUsers[data.receiver_id];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { sender_id: data.sender_id });
    }
  });

  socket.on('disconnect', () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});