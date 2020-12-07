import AWS from "aws-sdk";
import commonMiddlewere from "./lib/commonMiddlewere";
import createError from "http-errors";
import { getAuctionById } from "./getAuction";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
	const { id } = event.pathParameters;
	const { amount } = event.body;

	const auction = await getAuctionById(id);

	if (amount <= auction.highestBid.amount) {
		throw new createError.InternalServerError(
			`Your bid must be higher than ${auction.highestBid.amount}`
		);
	}

	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id },
		UpdateExpression: " set highestBid.amount = :amount",
		ExpressionAttributeValues: {
			":amount": amount,
		},
		ReturnValues: "ALL_NEW",
	};

	let updatedAuction;

	try {
		const result = await dynamodb.update(params).promise();
		updatedAuction = result.Attributes;
	} catch (err) {
		console.error(err);
		throw new createError.InternalServerError(err);
	}

	return {
		statusCode: 200,
		body: JSON.stringify(updatedAuction),
	};
}

export const handler = commonMiddlewere(placeBid);
