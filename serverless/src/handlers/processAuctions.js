import { getEndedAuctions } from "./lib/getEndedAuctions";
import { closeAuction } from "./lib/closeAuction";
import createError from "http-errors";

async function processAuctions(event, context) {
	try {
		const auctionsToClose = await getEndedAuctions();
		const closePromises = auctionsToClose.map((auction) =>
			closeAuction(auction)
		);
		await Promise.all(closePromises);

		return {
			close: closePromises.length,
		};
	} catch (err) {
		throw new createError.InternalServerError(err);
	}
}

export const handler = processAuctions;
