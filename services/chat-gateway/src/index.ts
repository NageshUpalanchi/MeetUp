import http from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const server = http.createServer();
const io = new Server(server, { cors: { origin: '*' } });

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redis = new Redis(redisHost);
const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION || 'us-east-1' });
const MESSAGES_TABLE = process.env.DYNAMODB_TABLE || 'meetup-messages-dev';

io.on('connection', (socket) => {
  const userId = (socket.handshake.query || {}).userId || 'anon';
  console.log('connected', userId);

  socket.join(`user:${userId}`);

  socket.on('join_conv', (convId) => {
    socket.join(`conv:${convId}`);
  });

  socket.on('send_message', async (payload) => {
    const messageId = uuidv4();
    const now = new Date().toISOString();
    const item = {
      pk: `CONV#${payload.conversationId}`,
      sk: `MSG#${now}#${messageId}`,
      senderId: userId,
      text: payload.text,
      type: payload.type || 'text',
      createdAt: now
    };

    try {
      await ddb.put({ TableName: MESSAGES_TABLE, Item: item }).promise();
      redis.publish(`conv:${payload.conversationId}`, JSON.stringify(item));
      socket.emit('sent', { messageId });
    } catch (e) {
      console.error('ddb put err', e);
      socket.emit('error', { error: 'failed to send' });
    }
  });

  socket.on('disconnect', () => {
    console.log('disconnected', userId);
  });
});

redis.psubscribe('conv:*', (err, count) => {});
redis.on('pmessage', (pattern, channel, message) => {
  try {
    const parsed = JSON.parse(message);
    const convId = parsed.pk.replace('CONV#', '');
    io.to(`conv:${convId}`).emit('new_message', parsed);
  } catch (e) {
    console.error('redis message parse err', e);
  }
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => console.log('chat gateway listening', PORT));
