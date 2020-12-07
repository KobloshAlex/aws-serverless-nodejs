import AWS from "aws-sdk";
import commonMiddlewere from "./lib/commonMiddlewere";
import createError from "http-errors";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
	let auctions;

	try {
		const results = await dynamodb
			.scan({
				TableName: process.env.AUCTIONS_TABLE_NAME,
			})
			.promise();

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

export const handler = commonMiddlewere(getAuctions);
