// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const axios = require('axios');
// Create express app
const app = express();
// Parse JSON bodies
app.use(bodyParser.json());
// Create comments object
const commentsByPostId = {};
// Create route to get all comments by post id
app.get('/posts/:id/comments', (req, res) => {
  // Return comments by post id
  res.send(commentsByPostId[req.params.id] || []);
});
// Create route to create comment by post id
app.post('/posts/:id/comments', async (req, res) => {
  // Generate random id
  const commentId = randomBytes(4).toString('hex');
  // Get comment content from request body
  const { content } = req.body;
  // Get comments by post id
  const comments = commentsByPostId[req.params.id] || [];
  // Add new comment to comments
  comments.push({ id: commentId, content, status: 'pending' });
  // Set comments by post id
  commentsByPostId[req.params.id] = comments;
  // Send event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { id: commentId, content, postId: req.params.id, status: 'pending' },
  });
  // Return comments
  res.status(201).send(comments);
});
// Create route to receive events
app.post('/events', async (req, res) => {
  // Get event type
  const { type, data } = req.body;
  // Check if event type is CommentModerated
    if (type === 'CommentModerated') {
        // Get comment by post id
        const { id, postId, status, content } = data;
        const comments = commentsByPostId[postId];
        // Get comment by id
        const comment = comments.find(comment => comment.id === id);
        // Set comment status
        comment.status = status;
        // Send event to event bus
        await axios.post('http://event-bus-srv:4005/events', {
            type: 'CommentUpdated',
            data: { id, postId, status, content },
        });
    }
    // Send ok status
} // Add this closing curly brace
);
// Listen on port 4001
app.listen(4001, () => {
  console.log('Listening on 4001');
});
