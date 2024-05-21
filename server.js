const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
};

const app = express();
const port = process.env.PORT || 3000;

//MongoDB connection URL
const url = "mongodb+srv://admin:admin123@MilesAndSmiles.snmtpne.mongodb.net/MilesAndSmiles";

mongoose.connect(url)
  .then(() => {
    const { name } = mongoose.connection; 
    console.log('MongoDB connected to database:', name); 
  })
  .catch(err => console.error(err));

const messageSchema = new mongoose.Schema({
  code: { type: String, required: true, maxlength: 7 },
  message: { type: String, required: true },
  sender: { type: String, required: true },
  seen: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);

app.use(cors(corsOptions));
app.use(express.json());

// Send Message Handling (`/send-message`)
app.post('/send-message', async (req, res) => {
  try {
    const newMessage = new Message({
      code: req.body.code,
      message: req.body.messageText,
      sender: req.body.senderName
    });

    await newMessage.save();

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Error: Message not sent!" });
  }
});

// Get Messages Handling (`/get-messages`)
app.get('/get-messages', async (req, res) => {
  try {
    const query = {};

    if (req.query.code) {
      query.code = req.query.code;
    }
    if (req.query.seen) {
      query.seen = req.query.seen === 'true';
    }
    console.log("query.code: " + query.code);
    console.log("query.seen: " + query.seen);

    const messages = await Message.find(query);
    console.log("messages: " + messages);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Handling update request
app.put('/update-message/:id', async (req, res) => {
  const messageId = req.params.id;
  console.log("messageId: " + messageId);

  try {
    const result = await Message.updateOne({ _id: new mongoose.Types.ObjectId(messageId), seen: { $ne: true } }, { $set: { seen: true } });
    console.log(result); // Logging the full request (in case of need to debug)
    if (result.nModified > 0) {
      res.json({ success: true, message: `Updated document.` });
    } else {
      res.json({ success: false, message: 'No document found with given ID.' });
    }
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ success: false, error: 'Error updating document.' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});