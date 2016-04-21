'use strict'

var NotImplementedException = require('../exceptions').NotImplementedException,
    Container = require('.').Container,
    FileInfo = require('.').FileInfo,
    AWS = require('aws-sdk'),
    S3Stream = require('s3-upload-stream');


class S3Container extends Container {

    /**
     * Constructs a new S3Container object.
     * 
     * @param  {string} bucket    Name of the bucket.
     * @param  {string} accessKeyId Storage access key.
     * @param  {string} secretAccessKey Storage secret key.
     */
    constructor(bucket, accessKeyId, secretAccessKey, region) {
        super();
        this.bucket = bucket;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this._s3 = new AWS.S3({
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
            bucket: bucket,
            region: region,
            domains: {}
        });
    }

    /**
     * @async
     * @return {string[]} List of files in the container.
     */
    listFiles() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self._listFiles(resolve, reject, null);
        });
    }

    /**
     * Get information about file.
     * 
     * @param  {string} filePath Path to the file in the container.
     * @async
     * @return {FileInfo} The information about given file.
     */
    getFileInfo(filePath) {
        var self = this;
        return new Promise((resolve, reject) => {
            self._s3.headObject({
                Bucket: self.bucket,
                Key: filePath
            }, (error, data) => {
                if (error) {
                    return reject(error);
                }
                var fileInfo = new FileInfo(filePath, data.ContentLength, new Date(data.LastModified), new Date(data.LastModified));
                return resolve(fileInfo);
            });

        });
    }

    /**
     * Returns readable stream of file data.
     * 
     * @param  {String} filePath Path to the file in the bucket.
     * @return {Stream}          Stream of file data.
     */
    getReadStream(filePath) {
        var stream = this._s3.getObject({
            Bucket: this.bucket,
            Key: filePath
        }).createReadStream();
        if (!stream)
            throw new NotFoundException(`File ${filePath} not found in the bucket ${this.bucket}`);
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
     * @return {[type]}
     */
    uploadFile(filePath, stream, fileSize) {
        var self = this;
        return new Promise((resolve, reject) => {
            var uploadStream = S3Stream(self._s3).upload({
                Bucket: self.bucket,
                Key: filePath
            });
            uploadStream.on('error', reject);
            uploadStream.on('uploaded', resolve);
            stream.pipe(uploadStream);
            stream.resume();
        });
    }

    /**
     * Joins all segments to one array.
     * 
     * @param  {Function} done      Callback that called when joining completed.
     * @param  {Function} reject    Callback that called when some error has occurred.
     * @param  {*} marker           The marker from s3 service. Null if it is first call.
     */
    _listFiles(done, reject, marker) {
        var self = this;
        var objects = [];
        this._s3.listObjects({
            Bucket: this.bucket,
            Marker: marker
        }, function(error, result) {
            if (error) {
                return reject(error);
            }
            objects.push.apply(objects, result.Contents);
            if (result.IsTruncated) {
                self._listFiles(done, reject, result.Marker);
            } else {
                var keys = objects.map((f) => {
                    return f.Key;
                });
                return done(keys);
            }
        });
    }
}

module.exports = S3Container;