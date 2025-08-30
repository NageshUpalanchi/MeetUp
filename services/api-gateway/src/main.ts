import express from 'express';
import AWS from 'aws-sdk';

const app = express();
app.use(express.json());
const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWS_REGION || 'us-east-1' });
const MESSAGES_TABLE = process.env.DYNAMODB_TABLE || 'meetup-messages-dev';

app.post('/conversations', async (req, res) => {
  const { conversationId, members } = req.body;
  try {
    for (const m of members) {
      await ddb.put({ TableName: MESSAGES_TABLE, Item: { pk: `USER#${m}`, sk: `CONV#${conversationId}`, createdAt: new Date().toISOString() } }).promise();
    }
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

app.get('/messages/:conversationId', async (req, res) => {
  const conv = req.params.conversationId;
  try {
    const resp = await ddb.query({ TableName: MESSAGES_TABLE, KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)', ExpressionAttributeValues: { ':pk': `CONV#${conv}`, ':sk': 'MSG#' }, Limit: 100 }).promise();
    res.json(resp.Items);
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
});

app.listen(8080, () => console.log('api listening on 8080'));
