module.exports = {
    Containers: {
        AzureBlobContainer: require('./lib/container/azure'),
        S3Container: require('./lib/container/s3'),
        Mock: require('./lib/container/mock'),
    },
    ContainerSync: require('./lib/sync')
}