const getContentfulCredentials = () => {
    const env = process.env.ENV;
    const contentfulEnvironmentId = process.env.CONTENTFUL_ENVIRONMENT_ID;
    const contentfulSpaceId = process.env.CONTENTFUL_SPACE_ID;
    const contentfulCmaToken = process.env.CONTENTFUL_CMA_TOKEN;
    const contentfulCdaToken = process.env.CONTENTFUL_CDA_TOKEN;
    const contentfulPreviewToken = process.env.CONTENTFUL_PREVIEW_TOKEN;

    // object to hold environment values based on deployed env
    const contentfulCredentials = {
        contentfulEnvironmentId: contentfulEnvironmentId,
        contentfulSpaceId: contentfulSpaceId,
        contentfulCmaToken: contentfulCmaToken,
        contentfulCdaToken: contentfulCdaToken,
        contentfulPreviewToken: contentfulPreviewToken
    }

    try {
        return contentfulCredentials;
    } catch (err) {
        console.error('Error getting Contentful Credentials\n' + err);
        throw new Error(err);
    }
};

module.exports = { getContentfulCredentials }
