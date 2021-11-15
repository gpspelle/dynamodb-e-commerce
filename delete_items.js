const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});

const { parallelScan } = require('@shelf/dynamodb-parallel-scan');


const TABLE_NAME = 'products';
const PRIMARY_PARTITION_KEY = 'id';

async function fetchAll() {
  const CONCURRENCY = 250;
  const alias = `#${PRIMARY_PARTITION_KEY}`;
  const name = PRIMARY_PARTITION_KEY;
  const scanParams = {
    TableName: TABLE_NAME,
    ProjectionExpression: alias,
    ExpressionAttributeNames: {[alias]: name},
  };

  const items = await parallelScan(scanParams, {concurrency: CONCURRENCY});
  return items;
}

function prepareRequestParams(items) {
  const requestParams = items.map((i) => ({
    DeleteRequest: {
      Key: {
        [PRIMARY_PARTITION_KEY]: i[PRIMARY_PARTITION_KEY],
      },
    },
  }));

  return requestParams;
}

async function sliceInChunks(arr) {
  let i;
  let j;
  const CHUNK_SIZE = 25; // DynamoDB BatchWriteItem limit
  const chunks = [];

  for (i = 0, j = arr.length; i < j; i += CHUNK_SIZE) {
    chunks.push(arr.slice(i, i + CHUNK_SIZE));
  }

  return chunks;
}

async function deleteItems(chunks) {
  const documentclient = new AWS.DynamoDB.DocumentClient();

  const promises = chunks.map(async function(chunk) {
    const params = {RequestItems: {[TABLE_NAME]: chunk}};
    const res = await documentclient.batchWrite(params).promise();
    return res;
  });

  return await Promise.all(promises);
}

(async () => {
  const items = await fetchAll();
  const params = prepareRequestParams(items);
  const chunks = await sliceInChunks(params);
  const res = await deleteItems(chunks);
  console.log(JSON.stringify(res));
})();