const { Client, Databases } = require("appwrite");

exports.handler = async (event) => {

  const slug = event.queryStringParameters.slug;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT);

  const databases = new Databases(client);

  const response = await databases.listDocuments(
    process.env.DB_ID,
    process.env.COLLECTION_ID
  );

  const post = response.documents.find(p => p.slug === slug);

  if (!post) {
    return {
      statusCode: 404,
      body: "Not found"
    };
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>${post.title}</title>
    <meta name="description" content="${post.description}">
    <meta property="og:image" content="${post.ogImage}">
  </head>
  <body>
    <h1>${post.title}</h1>
    <img src="${post.heroImage}" alt="${post.heroAlt}">
    <p>${post.description}</p>
  </body>
  </html>
  `;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html
  };
};