'use strict'

var Exceptions = require('../exceptions'),
    NotImplementedException = Exceptions.NotImplementedException,
    ArgumentException = Exceptions.ArgumentException,
    NotFoundException = Exceptions.NotFoundException,
    Container = require('.').Container,
    FileInfo = require('.').FileInfo,
    _ = require('lodash'),
    streamBuffers = require('stream-buffers');

class MockContainer extends Container {

    /**
     * Constructs a new MockContainer object.
     *
     */
    constructor(files) {
        super();
        if (!files) {
            files = {};
        }
        this.files = files;
    }

    /**
     * @return {Promise<string[]>} List of files in the container.
     */
    listFiles() {
        var self = this;
        return new Promise(function(resolve, reject) {
            resolve(Object.keys(self.files));
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
            var found = self.files[filePath];
            if (found) {
                return resolve(found);
            }
            return reject(new NotFoundException(`File "${filePath}" not found`));
        });
    }

    /**
     * Returns readable stream of file data.
     *
     * @param  {String} filePath Path to the file in the container.
     * @return {Stream}          Stream of file data.
     */
    getReadStream(filePath) {
        var found = this.files[filePath];
        if (!found) {
            throw new NotFoundException(`File "${filePath}" not found`);
        }
        var stream = new streamBuffers.ReadableStreamBuffer();
        stream.put(found.data);
        stream.stop();
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
            var found = self.files[filePath];
            if (!found) {
                return reject(new NotFoundException(`File "${filePath}"" not found`));
            }
            writeStream.end(found.data, resolve);
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
            var writeStream = new streamBuffers.WritableStreamBuffer();
            writeStream.on('error', reject);
            writeStream.on('finish', () => {
                writeStream.end();
                var file = new FileInfo(filePath, fileSize, new Date(), new Date());
                file.data = writeStream.getContents();
                self.files[filePath] = file;
                resolve();
            });
            stream.pipe(writeStream);
            stream.resume();
        });
    }
}

module.exports = MockContainer;
