const webpush = require('web-push');
const Interviewer = require('../models/Interviewer');
const { logEvent, logError } = require('../middleware/logger.middleware');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:support@yourwebsite.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Sends a push notification to a single subscription.
 * @param {object} subscription - The push subscription object from the browser.
 * @param {object} payload - The data to send with the notification.
 */
const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    // This often happens if a subscription is expired or invalid.
    // It should be handled by removing the subscription from the database.
    logError('push_notification_failed', error, { endpoint: subscription.endpoint, statusCode: error.statusCode });
    // Re-throw the error to be handled by the calling function.
    throw error;
  }
};

/**
 * Retrieves all subscriptions for an interviewer and sends them a notification.
 * @param {string} interviewerId - The ID of the interviewer to notify.
 * @param {object} payload - The notification payload (title, body, etc.).
 */
const sendNotificationToInterviewer = async (interviewerId, payload) => {
  try {
    const interviewer = await Interviewer.findById(interviewerId).select('pushSubscriptions');
    if (!interviewer || !interviewer.pushSubscriptions || interviewer.pushSubscriptions.length === 0) {
      logEvent('push_skipped_no_subscriptions', { interviewerId });
      return;
    }

    const invalidSubscriptions = [];
    const notificationPromises = interviewer.pushSubscriptions.map(async (subscription) => {
      try {
        await sendPushNotification(subscription, payload);
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // GONE or NOT FOUND: The subscription is no longer valid.
          invalidSubscriptions.push(subscription.endpoint);
        }
      }
    });

    await Promise.all(notificationPromises);

    // If there were any invalid subscriptions, clean them up from the database.
    if (invalidSubscriptions.length > 0) {
      await Interviewer.updateOne(
        { _id: interviewerId },
        { $pull: { pushSubscriptions: { endpoint: { $in: invalidSubscriptions } } } }
      );
      logEvent('cleaned_invalid_subscriptions', { interviewerId, count: invalidSubscriptions.length });
    }

  } catch (error) {
    logError('send_notification_to_interviewer_failed', error, { interviewerId });
  }
};

module.exports = {
  sendPushNotification,
  sendNotificationToInterviewer
};
