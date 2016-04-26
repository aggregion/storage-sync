'use strict'

var Exceptions = require('../exceptions'),
    NotImplementedException = Exceptions.NotImplementedException,
    ArgumentException = Exceptions.ArgumentException,
    Container = require('.').Container,
    FileInfo = require('.').FileInfo,
    azure = require('azure'),
    temp = require('temp'),
    fs = require('fs');

class AzureContainer extends Container {

    /**
     * Constructs a new AzureContainer object.
     * @constructor
     *
     * @param  {string} containerName    Name of container.
     * @param  {string} storageAccount   Access account id.
     * @param  {string} storageAccessKey Access secret key.
     */
    constructor(containerName, storageAccount, storageAccessKey) {
        super();
        this.containerName = containerName;
        this.storageAccount = storageAccount;
        this.storageAccessKey = storageAccessKey;
        this._blobService = azure.createBlobService(this.storageAccount, this.storageAccessKey);
    }

    /**
     * @return {Promise} List of blobs in the container (string[]).
     */
    listFiles() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self._listFiles(resolve, reject, [], null);
        });
    }

    /**
     * Get information about file.
     *
     * @param  {string} filePath Path to the file in the container.
     * @return {Promise<FileInfo>} The information about given file.
     */
    getFileInfo(filePath) {
        var self = this;
        return new Promise((resolve, reject) => {
            self._blobService.getBlobProperties(self.containerName, filePath, null, (error, response) => {
                if (error) {
                    return reject(error);
                }
                var fileInfo = new FileInfo(response.blob, response.contentLength, new Date(response.lastModified), new Date(response.lastModified));
                return resolve(fileInfo);
            });
        });
    }

    /**
     * Returns readable stream of blob data/
     *
     * @param  {String} filePath Path to the file in the container.
     * @return {Stream}          Stream of blob data.
     */
    getReadStream(filePath) {
        if (!filePath) {
            throw new ArgumentException('Argument "filePath" is required');
        }
        var stream = this._blobService.createReadStream(this.containerName, filePath);
        if (!stream) {
            throw new NotFoundException(`Blob ${filePath} not found in the container ${this.containerName}`);
        }
        stream.pause();
        return stream;
    }

    /**
     * Download file to stream.
     *
     * @param  {string} filePath Path to the file in the container.
     * @param {Stream} writeStream Destination stream;
     * @return {Stream} The stream to download given file.
     */
    copyToStream(filePath, writeStream) {
        var self = this;
        return new Promise((resolve, reject) => {
            var stream = self.getReadStream(filePath);
            stream
                .pipe(writeStream);
            stream.on('data', (chunk) => {
            });
            stream.on('end', () => resolve());
            stream.on('error', () => reject());
            stream.resume();
        });
    }

    /**
     * Upload file from stream.
     *
     * @param  {string} filePath Path to the file in the container.
     * @param  {strean} stream The stream from which file should be uploaded.
     * @return {Promise}
     */
    uploadFile(filePath, stream, fileSize) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var tmpFile = temp.openSync();
            var writeStream = fs.createWriteStream(null, {
                fd: tmpFile.fd,
                autoClose: true
            });
            stream.pipe(writeStream);
            stream.on('error', (e) => {
                fs.unlinkSync(tmpFile.path);
                reject(e);
            });
            stream.on('end', () => {
                self.speedSummary = self._blobService.createBlockBlobFromLocalFile(self.containerName, filePath, tmpFile.path, (error, result, response) => {
                    fs.unlinkSync(tmpFile.path);
                    if (error) {
                        return reject(error);
                    }
                    return resolve();
                });
                self._patchSpeedSummary(self.speedSummary, reject);
            });
        });
    }

    /**
     * Joins all segments to one array.
     *
     * @param  {Function} done              Callback that called when joining completed.
     * @param  {Function}   reject            Callback that called when some error has occurred.
     * @param  {string}   continuationToken Continuation token from blob service. Null if it is first call.
     */
    _listFiles(done, reject, blobs, continuationToken) {
        var self = this;
        this._blobService.listBlobsSegmented(this.containerName, continuationToken, function(error, result) {
            if (error) {
                // console.log('error');
                return reject(error);
            }
            blobs.push.apply(blobs, result.entries);
            var token = result.continuationToken;
            if (token) {
                // console.log(' Received a page of results. There are ' + result.entries.length + ' blobs on this page.');
                self._listFiles(done, reject, blobs, token);
            } else {
                // console.log(' Completed listing. There are ' + blobs.length + ' blobs');
                var files = blobs.map((b) => {
                    return new FileInfo(
                        b.name,
                        parseInt(b.properties['content-length']),
                        new Date(b.properties['last-modified']),
                        new Date(b.properties['last-modified'])
                    );
                });
                return done(files);
            }
        });
    }

    _patchSpeedSummary(speedSummary, onError) {
        // Work around a bug in azure client lib where exceptions thrown in SpeedSummary cannot be caught
        var getAutoIncrementFunction = speedSummary.getAutoIncrementFunction;
        speedSummary.getAutoIncrementFunction = function(size) {
            var f = getAutoIncrementFunction.call(speedSummary, size);
            return function(error, retValue) {
                try {
                    return f(error, retValue);
                } catch ( error ) {
                    onError(error);
                }
            }
        }
    }
}

module.exports = AzureContainer;
