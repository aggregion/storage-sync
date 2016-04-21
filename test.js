var AzureContainer = require('./lib/container/azure'),
    S3Container = require('./lib/container/s3'),
    StringStream = require('string-to-stream'),
    async = require('async'),
    path = require('path'),
    fs = require('fs'),
    chai = require('chai');

var azureCred = {
    container: 'sync-test',
    storageAccessKey: '49RbgefXwt0lPhPZQ6cw2bxzShEmjzvHnacJK0ZDgqJWMWU9Sj2+NUI953dESYMVABPGECvTOs2r/N2gPp7GnA==',
    storageAccount: 'aggregion'
};

var s3Cred = {
    accessKeyId: 'AKIAJQFLMQOCB7CHC35Q',
    secretAccessKey: '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',
    bucket: 'dl.uat.aggregion.com',
    region: 'eu-west-1',
    domains: {}
};

function generateTestData(container) {
    var blobs = [];
    for (var i = 0; i < 5; i++) {
        blobs.push(`sync-test/long/path/dir${i}/file${i}.txt`);
    }
    return new Promise((resolve, reject) => {
        async.eachSeries(blobs, (item, callback) => {
            container
                .uploadFile(item, StringStream("TEST"), 4)
                .then(() => callback(null))
                .catch((err) => callback(err));
        }, (err) => {
            if (err)
                return reject(err);
            return resolve();
        });
    });
}


function handleError(error) {
    console.log('An error occurred!');
    console.log(error);
    console.log(error.stack);
}

function test(container) {
	const testFile = 'sync-test/long/path/dir0/file0.txt';
    return new Promise((resolve, reject) => {
        generateTestData(container)
            .then((result) => {
                container
                    .listFiles()
                    .then((list) => {
                        chai.assert.isDefined(list, 'List is not defined');
                        chai.assert.isNotNull(list, 'List is null');
                        chai.assert.isTrue(list.length >= 5, 'List is too small');
                        container
                            .getFileInfo(testFile)
                            .then((info) => {
                                chai.assert.isDefined(info, 'Info is not defined');
                                chai.assert.isNotNull(info, 'Info is null');
                                chai.assert.equal(info.size, 4, 'Invalid size of file');
                                var stream = container.getReadStream(testFile);
                                chai.assert.isDefined(stream, 'Read stream is not defined');
                                const downloadTestFile = 'downloadTest';
                                container
                                    .uploadFile(downloadTestFile, stream, info.size)
                                    .then(() => {
                                        container
                                            .getFileInfo(downloadTestFile)
                                            .then((newInfo) => {
                                                chai.assert.equal(info.size, newInfo.size, 'Size of uploaded file not equals to original');
                                                var fileStream = fs.createWriteStream(path.join(__dirname, downloadTestFile));
                                                container
                                                    .copyToStream(downloadTestFile, fileStream)
                                                    .then(() => {
                                                        var stats = fs.statSync(downloadTestFile);
                                                        chai.assert.equal(info.size, stats.size, 'Size of downloaded file not equals to original');
                                                        resolve();
                                                    })
                                                    .catch(reject);
                                            })
                                            .catch(reject);
                                    })
                                    .catch(reject);
                            })
                            .catch(reject);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}


test(new AzureContainer(azureCred.container, azureCred.storageAccount, azureCred.storageAccessKey))
    .then(() => {
        console.log('Azure done!');
        test(new S3Container(s3Cred.bucket, s3Cred.accessKeyId, s3Cred.secretAccessKey, s3Cred.region))
            .then(() => {
                console.log('S3 done!');
            })
            .catch(handleError);
    })
    .catch(handleError);