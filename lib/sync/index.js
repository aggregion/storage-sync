'use strict'

var Exceptions = require('../exceptions'),
    ArgumentException = Exceptions.ArgumentException,
    NotFoundException = Exceptions.NotFoundException,
    Exception = Exceptions.Exception,
    Container = require('../container'),
    async = require('async'),
    EventEmitter = require('events');

class StorageSync extends EventEmitter {
    constructor(sourceContainer, destinationContainer) {
        super();
        if (!sourceContainer) {
            throw new ArgumentException('Argument sourceContainer is required');
        }
        if (!destinationContainer) {
            throw new ArgumentException('Argument destinationContainer is required');
        }
        this._sourceContainer = sourceContainer;
        this._destinationContainer = destinationContainer;
        this.used = false;
    }

    sync() {
        if (this.used) {
            throw new Exception('Sync can be invoked only once');
        }
        this.used = true;
        var self = this;
        return new Promise((resolve, reject) => {
            async.waterfall([
                (cb) => {
                    self._sourceContainer
                        .listFiles()
                        .then((sourceFiles) => cb(null, sourceFiles))
                        .catch(cb);
                },
                (sourceFiles, cb) => {
                    var actions = [];
                    async.eachSeries(sourceFiles, (sourceFile, cb) => {
                        self._processFile(sourceFile)
                            .then((action) => {
                                actions.push({
                                    path: sourceFile,
                                    action: action
                                });
                                cb(null);
                            })
                            .catch(cb);
                    }, (err) => {
                        cb(err, actions);
                    });
                }
            ], (err, actions) => {
                self.emit('syncDone', actions);
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });
    }

    _processFile(filePath) {
        var self = this;
        self.emit('file', filePath);
        return new Promise((resolve, reject) => {
            async.waterfall([
                (cb) => {
                    self._sourceContainer
                        .getFileInfo(filePath)
                        .then((info) => cb(null, info))
                        .catch(cb);
                },
                (sourceInfo, cb) => {
                    self._destinationContainer
                        .getFileInfo(filePath)
                        .then((info) => cb(null, sourceInfo, info))
                        .catch((e) => {
                            return cb(null, sourceInfo, null);
                        });
                },
                (sourceInfo, destinationInfo, cb) => {
                    if (
                            destinationInfo === null ||
                            sourceInfo.size !== destinationInfo.size ||
                            sourceInfo.modificationDate > destinationInfo.modificationDate
                    ) {
                        var readStream = self._sourceContainer.getReadStream(filePath);
                        self._destinationContainer
                            .uploadFile(filePath, readStream, sourceInfo.size)
                            .then(() => {
                                self.emit('fileDone', {
                                    path: filePath,
                                    action: 'copy'
                                });
                                cb(null, 'copy');
                            })
                            .catch(cb);
                    } else {
                        self.emit('fileDone', {
                            path: filePath,
                            action: 'skip'
                        });
                        cb(null, 'skip');
                    }
                }
            ], (err, data) => {
                if (err) {
                    return reject(err);
                }
                return resolve(data);
            });
        });
    }
}

module.exports = StorageSync;
