# storage-sync [![Build Status](https://travis-ci.org/aggregion/storage-sync.svg?branch=master)](https://travis-ci.org/aggregion/storage-sync)
Library for syncing data between cloud storage containers in any combinations. 

Supported storages:
* Azure BLOB storage
* Amazon S3

# Example
Sync Amazon S3 container to Azure BLOB container.

```
var storageSync = require('cloud-storage-sync');

var s3Container = new storageSync.Containers.S3Container('myS3Bucket', 'myAccessKey', 'mySecretKey', 'eu-westr-1');
var azureContainer = new storageSync.Containers.AzureBlobContainer('myContainer', 'myStorageAccount', 'myAccessKey');

var containerSync = new storageSync.ContainerSync(s3Container, azureContainer);

containerSync.on('file', (filePath) => {
    process.stdout.write(`Processing "${filePath}"...`);
});

containerSync.on('fileDone', (data) => {
    switch (data.action) {
    case 'copy':
        process.stdout.write("copied.\n");
        break;
    case 'skip':
        process.stdout.write("skipped.\n");
        break;
    default:
        process.stdout.write("done.\n");
    }
});

containerSync.on('syncDone', (data) => {
    console.log('Sync done');
});

containerSync.sync();

```