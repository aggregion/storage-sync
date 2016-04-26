'use strict'

var Exceptions = require('../exceptions'),
    ArgumentException = Exceptions.ArgumentException,
    NotFoundException = Exceptions.NotFoundException,
    Exception = Exceptions.Exception,
    Container = require('../container'),
    async = require('async'),
    EventEmitter = require('events'),
    _ = require('lodash');

class StorageSync extends EventEmitter {
    constructor(sourceContainer, destinationContainer, options) {
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
        if (!options) {
            options = {
                threads: 8
            };
        }
        this.options = options;
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
                    self.emit('countingStarted');
                    self._sourceContainer
                        .listFiles()
                        .then((sourceFiles) => {
                            self.emit('countingDone', sourceFiles.length);
                            cb(null, sourceFiles);
                        })
                        .catch(cb);
                },
                (sourceFiles, cb) => {
                    self._destinationContainer
                        .listFiles()
                        .then((destinationFiles) => cb(null, sourceFiles, destinationFiles))
                        .catch(cb);
                },
                (sourceFiles, destinationFiles, cb) => {
                    var actions = [];
                    var sourcesIndex = _.keyBy(sourceFiles, (f) => f.path);
                    var destinationsIndex = _.keyBy(destinationFiles, (f) => f.path);
                    async.eachLimit(sourceFiles, self.options.threads, (sourceInfo, cb) => {
                        self.emit('file', sourceInfo);
                        var destinationInfo = destinationsIndex[sourceInfo.path];
                        if (
                                !destinationInfo ||
                                sourceInfo.size !== destinationInfo.size ||
                                sourceInfo.modificationDate.getTime() > destinationInfo.modificationDate.getTime()
                        ) {
                            self._processFile(sourceInfo)
                                .then((action) => {
                                    var action = {
                                        path: sourceInfo.path,
                                        action: 'copy'
                                    };
                                    actions.push(action);
                                    self.emit('fileDone', action);
                                    cb(null);
                                })
                                .catch((e) => {
                                    self.emit('fileError', {
                                        path: sourceInfo.path,
                                        error: e
                                    });
                                    cb(null);
                                });
                        } else {
                            var action = {
                                path: sourceInfo.path,
                                action: 'skip'
                            };
                            actions.push(action);
                            self.emit('fileDone', action);
                            process.nextTick(() => cb(null));
                        }
                    }, cb);
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

    _processFile(fileInfo) {
        var readStream = this._sourceContainer.getReadStream(fileInfo.path);
        return this._destinationContainer.uploadFile(fileInfo.path, readStream, fileInfo.size);
    }
}

module.exports = StorageSync;
