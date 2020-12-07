import AWS from "aws-sdk";
import commonMiddlewere from "./lib/commonMiddlewere";
import createError from "http-errors";
import validator from "@middy/validator";
import getAuctionsSchema from "./lib/schemas/getAuctionsSchema";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
	const { status } = event.queryStringParameters;
	let auctions;

	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		IndexName: "statusAndEndDate",
		KeyConditionExpression: "#status = :status",
		ExpressionAttributeValues: {
			":status": status,
		},
		ExpressionAttributeNames: {
			"#status": "status",
		},
	};

	try {
		const results = await dynamodb.query(params).promise();

		auctions = results.Items;
	} catch (err) {
		console.log(err);
		throw new createError.InternalServerError(err);
	}
	return {
		statusCode: 200,
		body: JSON.stringify(auctions),
	};
}

export const handler = commonMiddlewere(getAuctions).use(
	validator({
		inputSchema: getAuctionsSchema,
		useDefaulst: true,
	})
);
