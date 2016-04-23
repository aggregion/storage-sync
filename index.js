var AzureBlobContainer = require('./lib/container/azure'),
    S3Container = require('./lib/container/s3'),
    MockContainer = require('./lib/container/mock'),
    ContainerSync = require('./lib/sync');

module.exports = {
    Containers: {
        AzureBlobContainer,
        S3Container,
        Mock
    },
    ContainerSync
};
