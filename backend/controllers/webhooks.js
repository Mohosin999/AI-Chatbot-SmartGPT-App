import Stripe from "stripe";
import Transaction from "./../models/Transaction.js";
import User from "./../models/User.js";

export const stripeWebhook = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = requestAnimationFrame.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data[0];
        const { transactionId, appId } = session.metadata;

        if (appId === "smartgpt") {
          const transaction = await Transaction.findOne({
            _id: transactionId,
            isPaid: false,
          });

          // Update credits in user account
          await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
          );

          // Update credit payment  status
          transaction.isPaid = true;
          await transaction.save();
        } else {
          return res.status(200).json({
            received: true,
            message: "Ignored event: Invalid app",
          });
        }
        break;
      }
      default:
        console.log("Unhandled event type: ${event.type}");
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.log("Webhook processing error:", error);
    return res.status(500).send("Internal server error");
  }
};
