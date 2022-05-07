const { DynamoDBClient, UpdateItemCommand, ScanCommand } = require("@aws-sdk/client-dynamodb");
const ddbClient = new DynamoDBClient({ region: 'sa-east-1' })
const PRODUCTS_TABLE = 'products'
const PRODUCTS_TABLE_PARTITION_KEY = 'id'

const updateItemOnDynamoDB = async (item, idAttributeName) => {
  const params = {
      TableName: PRODUCTS_TABLE,
      Key: {},
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: {},
      UpdateExpression: "",
  };

  params["Key"][idAttributeName] = {"S" : item[idAttributeName]};

  var setPrefix = "set ";

  const attributes = Object.keys(item);
  
  if(attributes.length == 1) {
    return;
  }

  var productImages;
  var productImagesResized;

  productImages = item.PRODUCT_IMAGES;
  productImagesResized = item.PRODUCT_IMAGES_RESIZED;

  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    if (attribute === PRODUCTS_TABLE_PARTITION_KEY) {
        continue;
    }

    params["UpdateExpression"] += setPrefix + "#" + attribute + " = :" + attribute;

    if (attribute === "PRODUCT_IMAGES") {
      params["ExpressionAttributeValues"][":" + attribute] = productImages;
    } else if (attribute === "PRODUCT_IMAGES_RESIZED") {
      params["ExpressionAttributeValues"][":" + attribute] = productImagesResized;
    }

    params["ExpressionAttributeNames"]["#" + attribute] = attribute;
    setPrefix = ", ";
  }

  await ddbClient.send(new UpdateItemCommand(params));
}

const process = async (items) => {
    const tasks = []
    items.forEach((item) => {
        const PRODUCT_IMAGES = []
        const PRODUCT_IMAGES_RESIZED = []
        item.PRODUCT_IMAGES.L.forEach((p) => {
            if (p.S.includes('us-east-1')) {
                x = p.S.replace('https', 'http')
                x = x.replace('e-commerce-', 'sa-e-commerce-')
                x = x.replace('us-east-1', 'sa-east-1')
                PRODUCT_IMAGES.push({"S": x})
            }
        })

        if (item.PRODUCT_IMAGES_RESIZED) {
            item.PRODUCT_IMAGES_RESIZED.L.forEach((p) => {
                if (p.S.includes('us-east-1')) {
                    x = p.S.replace('https', 'http')
                    x = x.replace('e-commerce-', 'sa-e-commerce-')
                    x = x.replace('us-east-1', 'sa-east-1')
                    PRODUCT_IMAGES_RESIZED.push({"S": x})
                }
            })
        }

        if (PRODUCT_IMAGES.length > 0 || PRODUCT_IMAGES_RESIZED.length > 0) {
            const task = {}

            task.id = item.id.S

            if (PRODUCT_IMAGES.length > 0) {
                task.PRODUCT_IMAGES = {"L": PRODUCT_IMAGES}
            }

            if (PRODUCT_IMAGES_RESIZED.length > 0) {
                task.PRODUCT_IMAGES_RESIZED = {"L": PRODUCT_IMAGES_RESIZED}
            }
            
            tasks.push(task)
        }
    })

    console.log(tasks)
    tasks.forEach(async (task) => {
        // update parameters on dynamodb
        try {
            console.log(task.id)
            await updateItemOnDynamoDB(task, PRODUCTS_TABLE_PARTITION_KEY);
            console.log("Item atualizado no dynamodb com sucesso");
        } catch(error) {
            console.error(error)
        }
    })
}

(async () => {
  const lastEvaluatedKey = null
  
  const params = {
    TableName: PRODUCTS_TABLE,
    ExclusiveStartKey: lastEvaluatedKey,
  }

  var items

  do {
    items = await ddbClient.send(new ScanCommand(params))
    params.ExclusiveStartKey = items.LastEvaluatedKey
    process(items.Items)
  } while (typeof items.LastEvaluatedKey !== "undefined")
})();