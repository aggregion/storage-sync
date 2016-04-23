'use strict'

var chai = require('chai'),
    StorageSync = require('.'),
    Exceptions = require('../exceptions'),
    Exception = Exceptions.Exception,
    ArgumentException = Exceptions.ArgumentException,
    MockContainer = require('../container/mock'),
    FileInfo = require('../container').FileInfo;

describe('StorageSync', () => {
    describe('#constructor', () => {
        it('should set source and destination container', () => {
            var src = new MockContainer();
            var dest = new MockContainer();
            var storageSync = new StorageSync(src, dest);
            chai.assert.equal(src, storageSync._sourceContainer, 'Constructor did not set sourceContainer');
            chai.assert.equal(dest, storageSync._destinationContainer, 'Constructor did not set destinationContainer');
        });

        it('should throw error when source container is not set', () => {
            var dest = new MockContainer();
            chai.assert.throws(() => {
                new StorageSync(null, dest);
            }, ArgumentException, null, 'Exception is not throwed if not pass sourceContainer');
        });

        it('should throw error when destination container is not set', () => {
            var src = new MockContainer();
            chai.assert.throws(() => {
                new StorageSync(src);
            }, ArgumentException, null, 'Exception is not throwed if not pass destinationContainer');
        });

        it('should set "used" flag to false', () => {
            var src = new MockContainer();
            var dest = new MockContainer();
            var storageSync = new StorageSync(src, dest);
            chai.assert.isFalse(storageSync.used, 'The "used" flag is not set to false');
        });
    });

    describe('#sync', () => {
        function getRandom(min, max) {
            return Math.random() * (max - min) + min;
        }
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }

        var files = {};
        for (var i = 0; i < 10; i++) {
            var path = `dir1/dir2/${Math.random().toString(36).substring(8)}`;
            var data = new Buffer(getRandomInt(100, 1000));
            var file = new FileInfo(path, data.length, new Date(), new Date());
            file.data = data;
            files[path] = file;
        }
        var fileInDestName = 'file/in/dest';
        var fileInDestSize = 5;
        var fileInDest = new FileInfo(fileInDestName, fileInDestSize, new Date(), new Date());
        var filesInDest = {};
        filesInDest[fileInDestName] = fileInDest;
        var src = new MockContainer(files);
        var dest = new MockContainer(filesInDest);

        before((done) => {
            var storageSync = new StorageSync(src, dest);
            storageSync
                .sync()
                .then(() => {
                    done();
                })
                .catch((e) => {
                    done(e);
                });
        });

        it('should sync files from source to destination', () => {
            Object.keys(src.files).forEach((k) => {
                var sf = src.files[k];
                var df = dest.files[k];
                chai.assert.equal(sf.path, df.path);
                chai.assert.equal(sf.size, df.size);
                chai.assert.deepEqual(sf.data, df.data);
            });
        });

        it('should not modify or delete any files in the destination container', () => {
            var df = dest.files[fileInDestName];
            chai.assert.isDefined(df, 'The file was removed from destination container');
            chai.assert.deepEqual(fileInDest, df, 'The file was modified in the destination container');
        });

        it('should not modify or delete any files in the source container', () => {
            chai.assert.deepEqual(files, src.files, 'The source container was modified');
        });

        it('should throw an Exception if called twice', () => {
            var src = new MockContainer();
            var dest = new MockContainer();
            var storageSync = new StorageSync(src, dest);
            storageSync.sync();
            chai.assert.throws(() => {
                storageSync.sync();
            }, Exception, null, 'Exception is not throwed if sync called twice');
        });
    });
});
