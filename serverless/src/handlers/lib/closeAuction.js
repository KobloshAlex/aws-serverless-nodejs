import AWS from "aws-sdk";

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

export async function closeAuction(auction) {
	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id: auction.id },
		UpdateExpression: "set #status = :status",
		ExpressionAttributeValues: {
			":status": "CLOSED",
		},
		ExpressionAttributeNames: {
			"#status": "status",
		},
	};

	await dynamodb.update(params).promise();

	const { title, seller, highestBid } = auction;
	const { amount, bidder } = highestBid;

	if (amount === 0) {
		await sqs
			.sendMessage({
				QueueUrl: process.env.MAIL_QUEUE_URL,
				MessageBody: JSON.stringify({
					subject: "You don't have any bidds",
					recipient: seller,
					body: `no bidds on ${title} for ${amount}`,
				}),
			})
			.promise();
		return;
	}

	const notifySeller = sqs
		.sendMessage({
			QueueUrl: process.env.MAIL_QUEUE_URL,
			MessageBody: JSON.stringify({
				subject: "Your Item has been Sold!",
				recipient: seller,
				body: `you got a sell ${title} for ${amount}`,
			}),
		})
		.promise();

	const notifyBidder = sqs
		.sendMessage({
			QueueUrl: process.env.MAIL_QUEUE_URL,
			MessageBody: JSON.stringify({
				subject: "You won an auction",
				recipient: bidder,
				body: `you won your last auction with amount ${amount}`,
			}),
		})
		.promise();

	return Promise.all([notifySeller, notifyBidder]);
}
