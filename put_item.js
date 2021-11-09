// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var params = {
  TableName: 'products',
  Item: {
    'id': {S: '2'},
    'PRODUCT_NAME' : {S: 'product 2'},
    'PRODUCT_DESCRIPTION' : {S: 'product 2 description'},
    'PRODUCT_PRICE': {N: '20'}
  }
};

// Call DynamoDB to add the item to the table
ddb.putItem(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});
