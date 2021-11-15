// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var params = {
  TableName: 'products',
  Item: {
    'id': {S: '1'},
    'PRODUCT_NAME' : {S: 'product 1'},
    'PRODUCT_DESCRIPTION' : {S: 'product 1 description'},
    'PRODUCT_PRICE': {N: '10'},
    'PRODUCT_IMAGES': {L: [{'S': 'https://e-commerce-images-bucket.s3.us-east-1.amazonaws.com/carlos1.jpg'}, {'S': 'https://e-commerce-images-bucket.s3.us-east-1.amazonaws.com/carlos2.jpg'}]}
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
