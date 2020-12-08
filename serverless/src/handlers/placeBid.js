import AWS from "aws-sdk";
import commonMiddlewere from "./lib/commonMiddlewere";
import createError from "http-errors";
import validator from "@middy/validator";
import placeBitSchema from "./lib/schemas/placeBitSchema";
import { getAuctionById } from "./getAuction";

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
	const { id } = event.pathParameters;
	const { amount } = event.body;
	const { email } = event.requestContext.authorizer;

	const auction = await getAuctionById(id);

	//Bit identity validation
	if (email === auction.seller) {
		throw new createError.Forbidden(`Cannot bit on your own auction`);
	}

	// Avoid double bidding
	if (email === auction.highestBid.bidder) {
		throw new createError.Forbidden(`You are allready the highest bidder`);
	}

	// Auction status validate
	if (auction.status !== "OPEN") {
		throw new createError.Forbidden(`You cannon bid on closed auctions`);
	}

	// Bit amount validation
	if (amount <= auction.highestBid.amount) {
		throw new createError.InternalServerError(
			`Your bid must be higher than ${auction.highestBid.amount}`
		);
	}

	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id },
		UpdateExpression:
			" set highestBid.amount = :amount, highestBid.bidder = :bidder",
		ExpressionAttributeValues: {
			":amount": amount,
			":bidder": email,
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

export const handler = commonMiddlewere(placeBid).use(
	validator({
		inputSchema: placeBitSchema,
	})
);
