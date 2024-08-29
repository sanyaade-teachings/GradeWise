const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {SecretManagerServiceClient} = require("@google-cloud/secret-manager");
const logger = require("firebase-functions/logger");
const OpenAI = require("openai").default;

admin.initializeApp();

// Instantiates a client
const client = new SecretManagerServiceClient();

/**
 * Retrieves the secret value from Google Cloud Secret Manager.
 *
 * @param {string} secretName The resource name of the secret version in format
 * `projects/ * /secrets;/ * /versions/*`.
 * @return {Promise<string>} The secret value as a string.
 */
async function getSecret(secretName) {
  const [version] = await client.accessSecretVersion({
    name: secretName,
  });

  const payload = version.payload.data.toString("utf8");
  return payload;
}

exports.gradeAssignment = functions.https.onCall(async (data, context) => {
  logger.info("gradeAssignment func called", {authUid: context.auth?.uid});

  if (!context.auth) {
    logger.warn("Unauthenticated request");
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to use this feature",
    );
  }

  const apiKey = await getSecret(process.env.API_KEY);

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [{"role": "user", "content": data.prompt}],
      temperature: 0.7,
      max_tokens: 1024,
    });
    logger.info("Successfully called OpenAI API");
    return {result: response.choices[0].message.content};
  } catch (error) {
    logger.error("Error grading assignment", {error: error.message});
    throw new functions.https.HttpsError(
        "internal",
        "Error grading assignment",
        error.message,
    );
  }
});
